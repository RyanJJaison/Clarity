"""Tests for the re-ranker.

The ranking logic is tested entirely through injected fake scorers, so no model
is downloaded and no network access is needed. :class:`CrossEncoderScorer` is
tested with an injected fake model object, which exercises the pair-building and
score-coercion logic without importing sentence-transformers.
"""

from __future__ import annotations

import pytest

from app.reranker import DEFAULT_MODEL, CrossEncoderScorer, RerankedCandidate, rerank
from app.tests.conftest import ConstantScorer, KeywordOverlapScorer, ScriptedScorer


class TestRerank:
    def test_reorders_candidates_by_score(self):
        candidates = ["irrelevant filler", "mitochondria make atp", "also unrelated"]
        result = rerank("mitochondria atp", candidates, KeywordOverlapScorer())
        assert result[0].text == "mitochondria make atp"

    def test_returns_all_candidates_when_top_k_is_none(self):
        candidates = ["a b", "c d", "e f"]
        result = rerank("query", candidates, ConstantScorer())
        assert len(result) == 3

    def test_top_k_truncates_after_sorting(self):
        # Scores put index 2 first, then 0, then 1. top_k=2 must keep the two
        # best, not the first two given.
        result = rerank("q", ["a", "b", "c"], ScriptedScorer([0.5, 0.1, 0.9]), top_k=2)
        assert [c.text for c in result] == ["c", "a"]

    def test_top_k_larger_than_candidate_count_is_harmless(self):
        result = rerank("q", ["a", "b"], ConstantScorer(), top_k=99)
        assert len(result) == 2

    def test_top_k_zero_returns_nothing(self):
        assert rerank("q", ["a", "b"], ConstantScorer(), top_k=0) == []

    def test_negative_top_k_raises(self):
        with pytest.raises(ValueError, match="top_k"):
            rerank("q", ["a"], ConstantScorer(), top_k=-1)

    def test_empty_candidates_returns_empty_without_calling_scorer(self):
        scorer = KeywordOverlapScorer()
        assert rerank("q", [], scorer) == []
        assert scorer.calls == []

    def test_original_index_maps_back_to_input_order(self):
        result = rerank("q", ["a", "b", "c"], ScriptedScorer([0.1, 0.9, 0.5]))
        assert [c.original_index for c in result] == [1, 2, 0]
        assert [c.text for c in result] == ["b", "c", "a"]

    def test_constant_scores_preserve_original_order(self):
        """A scorer with no opinion must be a no-op, not a shuffle."""
        candidates = ["first", "second", "third", "fourth"]
        result = rerank("q", candidates, ConstantScorer())
        assert [c.text for c in result] == candidates

    def test_scorer_receives_query_and_all_candidates_once(self):
        scorer = KeywordOverlapScorer()
        rerank("my query", ["a", "b", "c"], scorer)
        assert len(scorer.calls) == 1
        query, texts = scorer.calls[0]
        assert query == "my query"
        assert texts == ["a", "b", "c"]

    def test_wrong_number_of_scores_raises(self):
        with pytest.raises(ValueError, match="2 scores for 3 candidates"):
            rerank("q", ["a", "b", "c"], ScriptedScorer([0.1, 0.2]))

    def test_scores_are_coerced_to_float(self):
        result = rerank("q", ["a"], lambda q, t: [1])  # int, not float
        assert isinstance(result[0].score, float)

    def test_accepts_a_plain_lambda_as_scorer(self):
        """The scorer contract is structural — no base class to inherit."""
        result = rerank("q", ["short", "much longer text"], lambda q, t: [len(x) for x in t])
        assert result[0].text == "much longer text"

    def test_result_is_a_frozen_dataclass(self):
        result = rerank("q", ["a"], ConstantScorer())
        assert isinstance(result[0], RerankedCandidate)
        with pytest.raises(Exception):
            result[0].score = 9.0  # type: ignore[misc]


class FakeCrossEncoderModel:
    """Stand-in for sentence-transformers' CrossEncoder."""

    def __init__(self, scores):
        self.scores = scores
        self.received_pairs = None

    def predict(self, pairs):
        self.received_pairs = pairs
        return self.scores[: len(pairs)]


class TestCrossEncoderScorer:
    def test_injected_model_avoids_importing_sentence_transformers(self):
        model = FakeCrossEncoderModel([0.1, 0.9])
        scorer = CrossEncoderScorer(model=model)
        assert scorer(("what is atp"), ["a", "b"]) == [0.1, 0.9]

    def test_builds_query_text_pairs_for_the_model(self):
        model = FakeCrossEncoderModel([0.5, 0.5])
        CrossEncoderScorer(model=model)("my query", ["first", "second"])
        assert model.received_pairs == [("my query", "first"), ("my query", "second")]

    def test_empty_texts_short_circuits_without_calling_the_model(self):
        model = FakeCrossEncoderModel([])
        assert CrossEncoderScorer(model=model)("q", []) == []
        assert model.received_pairs is None

    def test_model_scores_are_coerced_to_float(self):
        scorer = CrossEncoderScorer(model=FakeCrossEncoderModel([1, 2]))
        assert all(isinstance(s, float) for s in scorer("q", ["a", "b"]))

    def test_default_model_name_is_the_documented_base(self):
        assert DEFAULT_MODEL == "cross-encoder/ms-marco-MiniLM-L-6-v2"
        assert CrossEncoderScorer(model=FakeCrossEncoderModel([])).model_name == DEFAULT_MODEL

    def test_works_as_a_scorer_for_rerank(self):
        """The real scorer class must satisfy the same contract as the fakes."""
        scorer = CrossEncoderScorer(model=FakeCrossEncoderModel([0.2, 0.8]))
        result = rerank("q", ["low", "high"], scorer)
        assert [c.text for c in result] == ["high", "low"]
