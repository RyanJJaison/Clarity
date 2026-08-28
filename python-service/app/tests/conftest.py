"""Shared fixtures and fakes.

Everything here is deliberately network-free and key-free: the point is that the
whole suite runs offline. Anything touching the real cross-encoder or the real
Gemini API is exercised through these fakes.
"""

from __future__ import annotations

from typing import Sequence

import pytest

from app.chunking import Chunk


class KeywordOverlapScorer:
    """A fake :class:`~app.reranker.Scorer` with no model behind it.

    Scores by word-overlap with the query, which gives a sensible, deterministic
    ordering — enough to assert that ranking logic reorders things correctly.
    """

    def __init__(self) -> None:
        self.calls: list[tuple[str, list[str]]] = []

    def __call__(self, query: str, texts: Sequence[str]) -> list[float]:
        self.calls.append((query, list(texts)))
        query_words = set(query.lower().split())
        scores = []
        for text in texts:
            text_words = set(text.lower().split())
            overlap = len(query_words & text_words)
            scores.append(overlap / (len(query_words) or 1))
        return scores


class ConstantScorer:
    """Scorer returning the same score for everything, to test tie stability."""

    def __init__(self, value: float = 0.5) -> None:
        self.value = value

    def __call__(self, query: str, texts: Sequence[str]) -> list[float]:
        return [self.value] * len(texts)


class ScriptedScorer:
    """Scorer returning pre-set scores in order, for exact assertions."""

    def __init__(self, scores: Sequence[float]) -> None:
        self.scores = list(scores)

    def __call__(self, query: str, texts: Sequence[str]) -> list[float]:
        return self.scores[: len(texts)]


class FakeGeminiClient:
    """Fake Gemini client returning canned responses, one per call.

    Requires neither google-genai nor an API key. A response may be an
    ``Exception`` instance, which is raised instead of returned, to exercise the
    "request failed" path.
    """

    def __init__(self, responses: Sequence[str | Exception]) -> None:
        self.responses = list(responses)
        self.prompts: list[str] = []

    def generate(self, prompt: str) -> str:
        self.prompts.append(prompt)
        if not self.responses:
            return "[]"
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


@pytest.fixture
def overlap_scorer() -> KeywordOverlapScorer:
    return KeywordOverlapScorer()


@pytest.fixture
def sample_chunks() -> list[Chunk]:
    """Four short, clearly distinct chunks for retrieval and training tests."""
    return [
        Chunk(text="Mitochondria are the powerhouse of the cell and make ATP.", position=0),
        Chunk(text="Chloroplasts contain chlorophyll and perform photosynthesis.", position=1),
        Chunk(text="Ribosomes translate messenger RNA into proteins.", position=2),
        Chunk(text="Lysosomes hold digestive enzymes at an acidic pH.", position=3),
    ]


def semantic_embed(texts: Sequence[str]) -> list[list[float]]:
    """A tiny bag-of-words embedder with real semantic signal.

    The production mock embeddings are hash-based and carry no signal, so they
    cannot be used to assert that retrieval finds the *right* chunk. This gives
    the eval-harness tests something meaningful to measure without a Voyage key.
    """
    vocab = [
        "mitochondria", "powerhouse", "atp", "cell",
        "chloroplasts", "chlorophyll", "photosynthesis",
        "ribosomes", "translate", "proteins", "rna",
        "lysosomes", "digestive", "enzymes", "acidic",
    ]
    vectors = []
    for text in texts:
        words = set(text.lower().replace(".", "").replace(",", "").split())
        vectors.append([1.0 if term in words else 0.0 for term in vocab])
    return vectors
