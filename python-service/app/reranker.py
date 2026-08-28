"""Cross-encoder re-ranking.

The ranking logic here is deliberately decoupled from any specific model. A
*scorer* is any callable taking ``(query, texts)`` and returning one relevance
score per text; :func:`rerank` only knows about that contract. That keeps the
ordering logic unit-testable with a trivial fake scorer, with no model download
and no network access.

:class:`CrossEncoderScorer` is the production implementation, backed by
sentence-transformers' ``CrossEncoder``. It imports sentence-transformers
lazily, inside the constructor, so that merely importing this module (as the
tests and the eval harness do) never pulls in torch.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Protocol, Sequence, runtime_checkable

DEFAULT_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"


@runtime_checkable
class Scorer(Protocol):
    """Scores how well each candidate text answers ``query``. Higher is better."""

    def __call__(self, query: str, texts: Sequence[str]) -> Sequence[float]: ...


@dataclass(frozen=True)
class RerankedCandidate:
    """A candidate after re-ranking.

    ``original_index`` is the candidate's position in the list handed to
    :func:`rerank`, which lets callers map back to whatever richer object
    (chunk, DB row) the text came from.
    """

    text: str
    score: float
    original_index: int


def rerank(
    query: str,
    candidates: Sequence[str],
    scorer: Scorer | Callable[[str, Sequence[str]], Sequence[float]],
    top_k: int | None = None,
) -> list[RerankedCandidate]:
    """Re-order ``candidates`` by the scorer's relevance judgement.

    Args:
        query: The user's question.
        candidates: Candidate texts, typically the top results from a cheaper
            first-stage retriever.
        scorer: Callable ``(query, texts) -> scores``, one score per text.
        top_k: Return at most this many results. ``None`` returns all of them.

    Returns:
        Candidates sorted by score descending. Ties keep the candidates'
        original relative order, so a scorer that returns a constant is a
        no-op rather than a shuffle.

    Raises:
        ValueError: If the scorer returns the wrong number of scores, or
            ``top_k`` is negative.
    """
    if top_k is not None and top_k < 0:
        raise ValueError("top_k must not be negative")

    if not candidates:
        return []

    scores = list(scorer(query, list(candidates)))
    if len(scores) != len(candidates):
        raise ValueError(
            f"scorer returned {len(scores)} scores for {len(candidates)} candidates"
        )

    ranked = [
        RerankedCandidate(text=text, score=float(score), original_index=index)
        for index, (text, score) in enumerate(zip(candidates, scores))
    ]

    # Negate score for descending order while keeping original_index ascending,
    # which makes ties stable and the whole function deterministic.
    ranked.sort(key=lambda c: (-c.score, c.original_index))

    return ranked if top_k is None else ranked[:top_k]


class CrossEncoderScorer:
    """Production :class:`Scorer` backed by a sentence-transformers CrossEncoder.

    Instantiating this downloads the model from Hugging Face on first use (or
    loads it from the local HF cache), so it requires network access the first
    time. Tests should inject a fake scorer instead.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL,
        *,
        max_length: int | None = 512,
        model: object | None = None,
    ) -> None:
        """
        Args:
            model_name: HF model id, or a path to a fine-tuned checkpoint such
                as one produced by ``app/training/train_reranker.py``.
            max_length: Truncation length passed to the CrossEncoder.
            model: Pre-built model object, mainly an injection point for tests.
                When given, sentence-transformers is not imported at all.
        """
        self.model_name = model_name

        if model is not None:
            self._model = model
            return

        try:
            from sentence_transformers import CrossEncoder
        except ImportError as exc:  # pragma: no cover - depends on environment
            raise ImportError(
                "CrossEncoderScorer requires sentence-transformers. "
                "Install it with: pip install sentence-transformers"
            ) from exc

        kwargs = {} if max_length is None else {"max_length": max_length}
        self._model = CrossEncoder(model_name, **kwargs)

    def __call__(self, query: str, texts: Sequence[str]) -> list[float]:
        """Score every ``(query, text)`` pair in one batched forward pass."""
        if not texts:
            return []
        pairs = [(query, text) for text in texts]
        return [float(score) for score in self._model.predict(pairs)]
