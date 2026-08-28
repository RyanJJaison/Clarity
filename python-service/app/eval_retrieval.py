"""Retrieval quality eval harness with re-ranking.

Extends the Node harness (``scripts/eval-retrieval.ts``) with a fourth method:
hybrid retrieval followed by cross-encoder re-ranking.

The re-ranker only ever sees the top ``--rerank-candidates`` results from hybrid
retrieval, not the whole corpus. That mirrors production — a cross-encoder scores
every (query, chunk) pair with a full forward pass, which is far too slow to run
over an entire corpus — and it means the re-ranker can only reorder what the
first stage already found. If hybrid retrieval misses a chunk entirely, no amount
of re-ranking recovers it, so re-ranked recall@k can never exceed hybrid
recall@candidate_count.

Usage:
    python -m app.eval_retrieval --k 3
    python -m app.eval_retrieval --k 3 --rerank-candidates 10
    python -m app.eval_retrieval --file data/eval/retrieval-eval-set.json

Without VOYAGE_API_KEY the harness falls back to deterministic mock embeddings,
which carry no semantic signal — useful only to verify the harness runs.
Without a re-ranker model available it skips the re-ranking method rather than
reporting a fake score.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Callable, Sequence

from app.chunking import Chunk, chunk_text
from app.embeddings import embed, is_mocked
from app.eval_metrics import EvalCase, MethodResult, summarize_method
from app.reranker import Scorer, rerank
from app.retrieval import (
    cosine_similarity,
    keyword_score,
    reciprocal_rank_fusion,
    to_ranking,
)

DEFAULT_EVAL_FILE = "data/eval/retrieval-eval-set.json"
DEFAULT_K = 5
DEFAULT_RERANK_CANDIDATES = 10


def load_eval_file(path: Path) -> tuple[str, list[EvalCase]]:
    """Load ``sourceText`` and the eval cases from a JSON eval set."""
    data = json.loads(path.read_text(encoding="utf-8"))
    cases = [EvalCase.from_dict(c) for c in data["cases"]]
    return data["sourceText"], cases


def rank_all_methods(
    chunks: Sequence[Chunk],
    cases: Sequence[EvalCase],
    *,
    scorer: Scorer | None = None,
    rerank_candidates: int = DEFAULT_RERANK_CANDIDATES,
    embed_fn: Callable[[Sequence[str]], list[list[float]]] = embed,
) -> dict[str, list[list[str]]]:
    """Rank the chunks for every case under each retrieval method.

    Returns a mapping of method name to a per-case list of ranked chunk texts.
    The re-ranked method is present only when ``scorer`` is given.

    ``embed_fn`` is injectable so tests can supply semantically meaningful
    vectors instead of the mock hash embeddings.
    """
    texts = [c.text for c in chunks]
    chunk_embeddings = embed_fn(texts)

    per_method: dict[str, list[list[str]]] = {
        "vector-only": [],
        "keyword-only": [],
        "hybrid (RRF)": [],
    }
    if scorer is not None:
        per_method["hybrid + rerank"] = []

    for case in cases:
        question_embedding = embed_fn([case.question])[0]

        vector_scores = [cosine_similarity(question_embedding, e) for e in chunk_embeddings]
        keyword_scores = [keyword_score(case.question, t) for t in texts]

        vector_ranking = to_ranking(vector_scores)
        keyword_ranking = to_ranking(keyword_scores)
        fused = reciprocal_rank_fusion([vector_ranking, keyword_ranking])

        per_method["vector-only"].append([texts[r.item] for r in vector_ranking])
        per_method["keyword-only"].append([texts[r.item] for r in keyword_ranking])

        hybrid_texts = [texts[f.item] for f in fused]
        per_method["hybrid (RRF)"].append(hybrid_texts)

        if scorer is not None:
            # Re-rank ONLY the top hybrid candidates, as production would.
            candidates = hybrid_texts[:rerank_candidates]
            reranked = [c.text for c in rerank(case.question, candidates, scorer)]
            # Keep the un-reranked tail so the ranked list stays a full
            # permutation of the corpus and MRR remains comparable across
            # methods.
            per_method["hybrid + rerank"].append(reranked + hybrid_texts[rerank_candidates:])

    return per_method


def build_scorer(model_name: str | None) -> tuple[Scorer | None, str | None]:
    """Try to build a real cross-encoder scorer.

    Returns ``(scorer, error)``. On failure the scorer is ``None`` and ``error``
    explains why, so the caller can skip the method and say so out loud rather
    than silently reporting a method it never ran.
    """
    if model_name is None:
        return None, None

    try:
        from app.reranker import CrossEncoderScorer

        return CrossEncoderScorer(model_name), None
    except Exception as exc:  # noqa: BLE001 - surface any load failure to the user
        return None, f"{type(exc).__name__}: {exc}"


def format_table(results: Sequence[MethodResult]) -> str:
    """Render results as a fixed-width table."""
    k = results[0].k if results else 0
    headers = ("method", f"recall@{k}", "mrr")
    rows = [
        (r.method, f"{r.recall_at_k * 100:.0f}%", f"{r.mrr:.3f}") for r in results
    ]

    widths = [
        max(len(headers[i]), *(len(row[i]) for row in rows)) if rows else len(headers[i])
        for i in range(3)
    ]

    def line(left: str, mid: str, right: str) -> str:
        return left + mid.join("─" * (w + 2) for w in widths) + right

    def render(cells: Sequence[str]) -> str:
        return "│" + "│".join(f" {c:<{w}} " for c, w in zip(cells, widths)) + "│"

    return "\n".join(
        [
            line("┌", "┬", "┐"),
            render(headers),
            line("├", "┼", "┤"),
            *(render(row) for row in rows),
            line("└", "┴", "┘"),
        ]
    )


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--k", type=int, default=DEFAULT_K, help="cutoff for recall@k")
    parser.add_argument("--file", default=DEFAULT_EVAL_FILE, help="path to eval set JSON")
    parser.add_argument(
        "--rerank-candidates",
        type=int,
        default=DEFAULT_RERANK_CANDIDATES,
        help="how many top hybrid results the re-ranker rescores",
    )
    parser.add_argument(
        "--reranker-model",
        default=None,
        help=(
            "cross-encoder model id or fine-tuned checkpoint path. Omit to skip "
            "the re-ranking method entirely."
        ),
    )
    args = parser.parse_args(argv)

    path = Path(args.file)
    if not path.is_absolute():
        path = Path.cwd() / path
    if not path.exists():
        print(f"Eval file not found: {path}", file=sys.stderr)
        return 1

    source_text, cases = load_eval_file(path)
    chunks = chunk_text(source_text)

    print(f"\nRetrieval eval: {args.file}")
    print(
        f"Source chunked into {len(chunks)} chunks. "
        f"{len(cases)} eval cases. k={args.k}."
    )

    if len(chunks) <= args.k:
        print(
            f"⚠ k={args.k} is >= the chunk count ({len(chunks)}), so every chunk is "
            "retrieved and recall@k is trivially 100% for every method. Use a longer "
            "source or a smaller k for a meaningful recall number."
        )

    if is_mocked():
        print(
            "⚠ VOYAGE_API_KEY is not set — using mock embeddings. Recall numbers "
            "below are NOT meaningful; this only verifies the harness runs."
        )

    scorer, scorer_error = build_scorer(args.reranker_model)
    if args.reranker_model is None:
        print("ℹ No --reranker-model given, so the re-ranking method is skipped.")
    elif scorer is None:
        print(
            f"⚠ Could not load re-ranker '{args.reranker_model}', so the re-ranking "
            f"method is skipped rather than reported with a fake score. Reason: {scorer_error}"
        )

    per_method = rank_all_methods(
        chunks,
        cases,
        scorer=scorer,
        rerank_candidates=args.rerank_candidates,
    )

    results = [
        summarize_method(method, ranked, cases, args.k)
        for method, ranked in per_method.items()
    ]

    print()
    print(format_table(results))

    final = results[-1]
    if final.misses:
        print(f"\nMisses under {final.method} ({len(final.misses)}/{final.case_count}):")
        for question in final.misses:
            print(f'  - "{question}"')
    else:
        print(f"\nNo misses under {final.method} at this k. 🎉")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
