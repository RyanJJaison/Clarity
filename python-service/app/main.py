"""FastAPI service exposing chunking, hybrid retrieval, and re-ranking.

The re-ranker model is loaded lazily on first use and cached, so importing this
module (and the health endpoint) never triggers a model download. When no model
is available the ``/rerank`` endpoint returns 503 with the reason rather than
silently falling back to an unranked order.
"""

from __future__ import annotations

import os
from typing import Sequence

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.chunking import chunk_text
from app.embeddings import embed, is_mocked
from app.reranker import DEFAULT_MODEL, Scorer, rerank
from app.retrieval import (
    cosine_similarity,
    keyword_score,
    reciprocal_rank_fusion,
    to_ranking,
)

app = FastAPI(title="Clarity retrieval service", version="0.1.0")

# Cached scorer, built on first /rerank call.
_scorer: Scorer | None = None
_scorer_error: str | None = None


def get_scorer() -> Scorer:
    """Return the cached cross-encoder scorer, building it on first call.

    Raises HTTP 503 if the model cannot be loaded (e.g. no network on first
    download, or sentence-transformers not installed).
    """
    global _scorer, _scorer_error

    if _scorer is not None:
        return _scorer
    if _scorer_error is not None:
        raise HTTPException(status_code=503, detail=_scorer_error)

    try:
        from app.reranker import CrossEncoderScorer

        _scorer = CrossEncoderScorer(os.environ.get("RERANKER_MODEL", DEFAULT_MODEL))
        return _scorer
    except Exception as exc:  # noqa: BLE001 - report any load failure as 503
        _scorer_error = f"re-ranker unavailable: {type(exc).__name__}: {exc}"
        raise HTTPException(status_code=503, detail=_scorer_error) from exc


def set_scorer(scorer: Scorer | None) -> None:
    """Override the cached scorer. Injection point for tests."""
    global _scorer, _scorer_error
    _scorer = scorer
    _scorer_error = None


class ChunkRequest(BaseModel):
    text: str


class ChunkResponse(BaseModel):
    chunks: list[dict]
    count: int


class SearchRequest(BaseModel):
    query: str
    documents: list[str] = Field(..., min_length=1)
    top_k: int = Field(5, ge=1)


class SearchResult(BaseModel):
    text: str
    score: float
    index: int


class SearchResponse(BaseModel):
    results: list[SearchResult]
    embeddings_mocked: bool


class RerankRequest(BaseModel):
    query: str
    candidates: list[str] = Field(..., min_length=1)
    top_k: int = Field(5, ge=1)


class RerankResponse(BaseModel):
    results: list[SearchResult]
    model: str


@app.get("/health")
def health() -> dict:
    """Liveness check. Never loads the re-ranker model."""
    return {
        "status": "ok",
        "embeddings_mocked": is_mocked(),
        "reranker_loaded": _scorer is not None,
    }


@app.post("/chunk", response_model=ChunkResponse)
def chunk_endpoint(request: ChunkRequest) -> ChunkResponse:
    """Split text into overlapping chunks."""
    chunks = chunk_text(request.text)
    return ChunkResponse(
        chunks=[{"text": c.text, "position": c.position} for c in chunks],
        count=len(chunks),
    )


@app.post("/search", response_model=SearchResponse)
def search_endpoint(request: SearchRequest) -> SearchResponse:
    """Hybrid (vector + keyword, RRF-fused) search over the given documents."""
    docs = request.documents
    doc_embeddings = embed(docs)
    query_embedding = embed([request.query])[0]

    vector_scores = [cosine_similarity(query_embedding, e) for e in doc_embeddings]
    keyword_scores = [keyword_score(request.query, d) for d in docs]

    fused = reciprocal_rank_fusion(
        [to_ranking(vector_scores), to_ranking(keyword_scores)]
    )

    return SearchResponse(
        results=[
            SearchResult(text=docs[f.item], score=f.score, index=f.item)
            for f in fused[: request.top_k]
        ],
        embeddings_mocked=is_mocked(),
    )


@app.post("/rerank", response_model=RerankResponse)
def rerank_endpoint(request: RerankRequest) -> RerankResponse:
    """Re-rank candidate passages with the cross-encoder."""
    scorer = get_scorer()
    reranked = rerank(request.query, request.candidates, scorer, top_k=request.top_k)

    return RerankResponse(
        results=[
            SearchResult(text=c.text, score=c.score, index=c.original_index)
            for c in reranked
        ],
        model=os.environ.get("RERANKER_MODEL", DEFAULT_MODEL),
    )
