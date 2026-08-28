"""Retrieval quality metrics — a port of ``lib/eval/retrieval-metrics.ts``.

Pure functions over already-ranked chunk texts, so they can be unit-tested
without any retrieval, embedding, or model machinery.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence


@dataclass(frozen=True)
class EvalCase:
    """One eval question plus the criteria for what counts as a correct chunk."""

    question: str
    # Chunk must contain ALL of these substrings (case-insensitive) to hit.
    must_contain: tuple[str, ...] = ()
    # Chunk must contain AT LEAST ONE of these substrings (case-insensitive).
    # Empty means "no anyOf constraint", matching the TypeScript behaviour.
    any_of: tuple[str, ...] = ()

    @staticmethod
    def from_dict(data: dict) -> "EvalCase":
        """Build a case from the JSON eval-set shape (camelCase keys)."""
        return EvalCase(
            question=data["question"],
            must_contain=tuple(data.get("mustContain", ()) or ()),
            any_of=tuple(data.get("anyOf", ()) or ()),
        )


def chunk_matches_case(chunk_text: str, case: EvalCase) -> bool:
    """Whether one retrieved chunk satisfies a case's answer criteria."""
    lower = chunk_text.lower()
    must_ok = all(s.lower() in lower for s in case.must_contain)
    any_ok = not case.any_of or any(s.lower() in lower for s in case.any_of)
    return must_ok and any_ok


def hit_at_k(ranked_chunk_texts: Sequence[str], case: EvalCase, k: int) -> bool:
    """True if any of the top-k ranked chunks satisfies the case."""
    return any(chunk_matches_case(t, case) for t in ranked_chunk_texts[:k])


def reciprocal_rank_of_first_hit(
    ranked_chunk_texts: Sequence[str], case: EvalCase
) -> float:
    """Reciprocal rank (1-based) of the first matching chunk, or 0.0 if none."""
    for index, text in enumerate(ranked_chunk_texts):
        if chunk_matches_case(text, case):
            return 1.0 / (index + 1)
    return 0.0


@dataclass(frozen=True)
class MethodResult:
    """Aggregate scores for one retrieval method across all eval cases."""

    method: str
    recall_at_k: float
    mrr: float
    k: int
    case_count: int
    misses: tuple[str, ...] = field(default=())


def summarize_method(
    method: str,
    per_case_ranked_texts: Sequence[Sequence[str]],
    cases: Sequence[EvalCase],
    k: int,
) -> MethodResult:
    """Compute recall@k and MRR for one method, recording which cases missed.

    ``per_case_ranked_texts`` is parallel to ``cases``; a missing or short entry
    is treated as "retrieved nothing" rather than an error, so a method that
    fails on some cases still produces a comparable score.
    """
    hits = 0
    rr_sum = 0.0
    misses: list[str] = []

    for i, case in enumerate(cases):
        ranked = per_case_ranked_texts[i] if i < len(per_case_ranked_texts) else []
        if hit_at_k(ranked, case, k):
            hits += 1
        else:
            misses.append(case.question)
        rr_sum += reciprocal_rank_of_first_hit(ranked, case)

    count = len(cases)
    return MethodResult(
        method=method,
        recall_at_k=0.0 if count == 0 else hits / count,
        mrr=0.0 if count == 0 else rr_sum / count,
        k=k,
        case_count=count,
        misses=tuple(misses),
    )
