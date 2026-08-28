"""Retrieval scoring and rank fusion — a port of the helpers in ``lib/rag.ts``.

Contains the three pieces the eval harness needs to rank chunks without a
database: cosine similarity over embeddings, a crude keyword score, and
Reciprocal Rank Fusion to combine the two rankings.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import Generic, Sequence, TypeVar

T = TypeVar("T")

_TOKEN_RE = re.compile(r"[a-z0-9]+")

# Standard constant from the original RRF paper (Cormack et al.). Not
# sensitive to tuning in practice.
RRF_K = 60


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    """Cosine similarity of two equal-length vectors; 0.0 if either is zero."""
    if len(a) != len(b):
        raise ValueError("vector length mismatch")

    dot = 0.0
    norm_a = 0.0
    norm_b = 0.0
    for x, y in zip(a, b):
        dot += x * y
        norm_a += x * x
        norm_b += y * y

    denom = math.sqrt(norm_a) * math.sqrt(norm_b)
    return 0.0 if denom == 0 else dot / denom


def tokenize(text: str) -> list[str]:
    """Lowercase alphanumeric tokens of length > 1."""
    return [t for t in _TOKEN_RE.findall(text.lower()) if len(t) > 1]


def keyword_score(query: str, text: str) -> float:
    """Crude keyword relevance: query-term coverage weighted by term frequency.

    Not a replacement for Postgres full-text search (which does proper
    stemming and ranking in production) — this is a lightweight stand-in so
    the eval harness can run entirely in memory.
    """
    query_terms = tokenize(query)
    if not query_terms:
        return 0.0

    text_counts: dict[str, int] = {}
    for token in tokenize(text):
        text_counts[token] = text_counts.get(token, 0) + 1

    score = 0.0
    for term in set(query_terms):
        count = text_counts.get(term, 0)
        if count > 0:
            score += 1 + math.log(count)

    return score / len(query_terms)


@dataclass(frozen=True)
class RankedItem(Generic[T]):
    """An item at a 1-based rank position within a single ranking."""

    item: T
    rank: int


@dataclass(frozen=True)
class FusedItem(Generic[T]):
    """An item with its fused score, after combining several rankings."""

    item: T
    score: float


def to_ranking(scores: Sequence[float]) -> list[RankedItem[int]]:
    """Turn a list of scores into a ranking of indices, best score first.

    Ties break by index so the ordering is deterministic across runs.
    """
    order = sorted(range(len(scores)), key=lambda i: (-scores[i], i))
    return [RankedItem(item=index, rank=rank) for rank, index in enumerate(order, start=1)]


def reciprocal_rank_fusion(
    rankings: Sequence[Sequence[RankedItem[T]]],
    k: int = RRF_K,
) -> list[FusedItem[T]]:
    """Combine several ranked lists of the same items into one ranking.

    Uses only rank position, not raw scores, which avoids having to normalize
    incomparable scales (cosine similarity vs. a keyword-match score) onto a
    common one.
    """
    scores: dict[T, float] = {}
    first_seen: dict[T, int] = {}

    for ranking in rankings:
        for entry in ranking:
            scores[entry.item] = scores.get(entry.item, 0.0) + 1.0 / (k + entry.rank)
            first_seen.setdefault(entry.item, len(first_seen))

    # Sort by fused score descending, breaking ties by first-seen order for
    # deterministic output.
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], first_seen[kv[0]]))
    return [FusedItem(item=item, score=score) for item, score in ordered]
