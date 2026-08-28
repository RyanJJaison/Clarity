"""Tests for cosine similarity, keyword scoring, and RRF."""

from __future__ import annotations

import math

import pytest

from app.retrieval import (
    RankedItem,
    cosine_similarity,
    keyword_score,
    reciprocal_rank_fusion,
    to_ranking,
    tokenize,
)


class TestCosineSimilarity:
    def test_identical_vectors_score_one(self):
        assert cosine_similarity([1.0, 2.0, 3.0], [1.0, 2.0, 3.0]) == pytest.approx(1.0)

    def test_orthogonal_vectors_score_zero(self):
        assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)

    def test_opposite_vectors_score_minus_one(self):
        assert cosine_similarity([1.0, 0.0], [-1.0, 0.0]) == pytest.approx(-1.0)

    def test_magnitude_does_not_affect_similarity(self):
        assert cosine_similarity([1.0, 1.0], [5.0, 5.0]) == pytest.approx(1.0)

    def test_zero_vector_returns_zero_rather_than_dividing_by_zero(self):
        assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0
        assert cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0

    def test_length_mismatch_raises(self):
        with pytest.raises(ValueError, match="length mismatch"):
            cosine_similarity([1.0], [1.0, 2.0])


class TestTokenize:
    def test_lowercases_and_splits_on_non_alphanumerics(self):
        assert tokenize("Hello, World! ATP-synthase") == ["hello", "world", "atp", "synthase"]

    def test_drops_single_character_tokens(self):
        assert tokenize("a bb c dd") == ["bb", "dd"]

    def test_empty_text_yields_no_tokens(self):
        assert tokenize("") == []
        assert tokenize("!!! ???") == []


class TestKeywordScore:
    def test_empty_query_scores_zero(self):
        assert keyword_score("", "some text") == 0.0
        assert keyword_score("!!", "some text") == 0.0

    def test_no_overlap_scores_zero(self):
        assert keyword_score("mitochondria atp", "completely unrelated words") == 0.0

    def test_full_single_occurrence_overlap_scores_one(self):
        # Both query terms appear exactly once: (1 + 1) / 2 == 1.0
        assert keyword_score("mitochondria atp", "mitochondria make atp") == pytest.approx(1.0)

    def test_partial_overlap_scores_between_zero_and_one(self):
        score = keyword_score("mitochondria atp", "mitochondria are organelles")
        assert 0.0 < score < 1.0

    def test_repeated_terms_score_higher_via_log_weighting(self):
        once = keyword_score("atp", "atp is energy")
        twice = keyword_score("atp", "atp and more atp")
        assert twice > once
        assert twice == pytest.approx(1 + math.log(2))

    def test_scoring_is_case_insensitive(self):
        assert keyword_score("ATP", "atp") == keyword_score("atp", "ATP")

    def test_duplicate_query_terms_do_not_double_count_numerator(self):
        # Unique terms drive the numerator, but the denominator uses total
        # query length, so a repeated query term dilutes the score.
        assert keyword_score("atp atp", "atp") == pytest.approx(0.5)


class TestToRanking:
    def test_ranks_highest_score_first_with_one_based_ranks(self):
        ranking = to_ranking([0.1, 0.9, 0.5])
        assert [r.item for r in ranking] == [1, 2, 0]
        assert [r.rank for r in ranking] == [1, 2, 3]

    def test_ties_break_by_index_for_determinism(self):
        ranking = to_ranking([0.5, 0.5, 0.5])
        assert [r.item for r in ranking] == [0, 1, 2]

    def test_empty_scores_yield_empty_ranking(self):
        assert to_ranking([]) == []


class TestReciprocalRankFusion:
    def test_item_ranked_first_everywhere_wins(self):
        a = [RankedItem("x", 1), RankedItem("y", 2)]
        b = [RankedItem("x", 1), RankedItem("y", 2)]
        fused = reciprocal_rank_fusion([a, b])
        assert fused[0].item == "x"

    def test_uses_rank_not_raw_score_magnitude(self):
        # "y" is rank 1 in one list and rank 3 in the other; "x" is rank 2 in
        # both. RRF should favour y: 1/61 + 1/63 > 2/62.
        a = [RankedItem("x", 2), RankedItem("y", 1)]
        b = [RankedItem("x", 2), RankedItem("y", 3)]
        fused = reciprocal_rank_fusion([a, b])
        assert fused[0].item == "y"

    def test_scores_sum_across_rankings(self):
        a = [RankedItem("x", 1)]
        b = [RankedItem("x", 1)]
        fused = reciprocal_rank_fusion([a, b], k=60)
        assert fused[0].score == pytest.approx(2 / 61)

    def test_item_present_in_only_one_ranking_is_still_included(self):
        a = [RankedItem("x", 1)]
        b = [RankedItem("y", 1)]
        fused = reciprocal_rank_fusion([a, b])
        assert {f.item for f in fused} == {"x", "y"}

    def test_output_is_sorted_descending_by_score(self):
        a = [RankedItem("x", 1), RankedItem("y", 2), RankedItem("z", 3)]
        fused = reciprocal_rank_fusion([a])
        scores = [f.score for f in fused]
        assert scores == sorted(scores, reverse=True)

    def test_empty_input_yields_empty_output(self):
        assert reciprocal_rank_fusion([]) == []
        assert reciprocal_rank_fusion([[]]) == []

    def test_smaller_k_amplifies_rank_differences(self):
        ranking = [RankedItem("x", 1), RankedItem("y", 2)]
        tight = reciprocal_rank_fusion([ranking], k=1)
        loose = reciprocal_rank_fusion([ranking], k=1000)

        tight_gap = tight[0].score - tight[1].score
        loose_gap = loose[0].score - loose[1].score
        assert tight_gap > loose_gap
