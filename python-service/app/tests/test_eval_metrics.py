"""Tests for recall@k / MRR scoring, mirroring tests/retrieval-metrics.test.ts."""

from __future__ import annotations

import pytest

from app.eval_metrics import (
    EvalCase,
    chunk_matches_case,
    hit_at_k,
    reciprocal_rank_of_first_hit,
    summarize_method,
)


class TestChunkMatchesCase:
    def test_requires_all_must_contain_terms_case_insensitively(self):
        case = EvalCase(question="q", must_contain=("Mitochondria", "ATP"))
        assert chunk_matches_case("mitochondria produce atp", case)
        assert not chunk_matches_case("mitochondria produce energy", case)

    def test_requires_at_least_one_any_of_term(self):
        case = EvalCase(question="q", any_of=("ribosome", "translate"))
        assert chunk_matches_case("ribosomes make proteins", case)
        assert not chunk_matches_case("nothing relevant here", case)

    def test_combines_must_contain_and_any_of(self):
        case = EvalCase(question="q", must_contain=("cell",), any_of=("nucleus", "membrane"))
        assert chunk_matches_case("the cell has a nucleus", case)
        assert not chunk_matches_case("the organ has a nucleus", case)
        assert not chunk_matches_case("the cell is small", case)

    def test_case_with_no_criteria_matches_anything(self):
        """Mirrors the TypeScript behaviour: absent criteria are not constraints."""
        assert chunk_matches_case("literally anything", EvalCase(question="q"))

    def test_matches_substrings_not_whole_words(self):
        case = EvalCase(question="q", must_contain=("ribosome",))
        assert chunk_matches_case("ribosomes", case)


class TestHitAtK:
    def test_finds_a_hit_inside_the_top_k_window(self):
        case = EvalCase(question="q", must_contain=("mitochondria",))
        ranked = ["photosynthesis text", "mitochondria text", "ribosome text"]
        assert hit_at_k(ranked, case, 2)

    def test_misses_when_the_match_is_outside_the_window(self):
        case = EvalCase(question="q", must_contain=("ribosome",))
        ranked = ["photosynthesis text", "mitochondria text", "ribosome text"]
        assert not hit_at_k(ranked, case, 2)

    def test_k_larger_than_the_result_list_is_harmless(self):
        case = EvalCase(question="q", must_contain=("atp",))
        assert hit_at_k(["makes atp"], case, 99)

    def test_k_zero_never_hits(self):
        case = EvalCase(question="q", must_contain=("atp",))
        assert not hit_at_k(["makes atp"], case, 0)

    def test_empty_results_never_hit(self):
        assert not hit_at_k([], EvalCase(question="q", must_contain=("atp",)), 5)


class TestReciprocalRankOfFirstHit:
    def test_returns_one_when_the_first_result_matches(self):
        case = EvalCase(question="q", must_contain=("atp",))
        assert reciprocal_rank_of_first_hit(["contains atp"], case) == 1.0

    def test_returns_zero_when_nothing_matches(self):
        case = EvalCase(question="q", must_contain=("atp",))
        assert reciprocal_rank_of_first_hit(["irrelevant"], case) == 0.0

    @pytest.mark.parametrize("position,expected", [(0, 1.0), (1, 0.5), (2, 1 / 3), (3, 0.25)])
    def test_reciprocal_of_the_one_based_rank(self, position, expected):
        case = EvalCase(question="q", must_contain=("target",))
        ranked = ["filler"] * 4
        ranked[position] = "the target"
        assert reciprocal_rank_of_first_hit(ranked, case) == pytest.approx(expected)

    def test_uses_the_first_hit_when_several_match(self):
        case = EvalCase(question="q", must_contain=("atp",))
        assert reciprocal_rank_of_first_hit(["no", "atp here", "atp again"], case) == 0.5


class TestSummarizeMethod:
    def test_computes_recall_at_k_and_mrr(self):
        cases = [
            EvalCase(question="a", must_contain=("alpha",)),
            EvalCase(question="b", must_contain=("beta",)),
        ]
        ranked = [
            ["alpha text", "other"],  # hit at rank 1
            ["irrelevant", "other"],  # no hit
        ]
        result = summarize_method("vector", ranked, cases, 5)
        assert result.recall_at_k == 0.5
        assert result.mrr == 0.5  # (1 + 0) / 2

    def test_records_which_questions_missed(self):
        cases = [
            EvalCase(question="hits", must_contain=("alpha",)),
            EvalCase(question="misses", must_contain=("beta",)),
        ]
        result = summarize_method("m", [["alpha"], ["nope"]], cases, 5)
        assert result.misses == ("misses",)

    def test_recall_counts_only_within_k_while_mrr_sees_the_full_list(self):
        """recall@k truncates; MRR does not. A hit past k scores 0 recall but non-zero MRR."""
        cases = [EvalCase(question="a", must_contain=("target",))]
        ranked = [["no", "no", "target"]]
        result = summarize_method("m", ranked, cases, k=2)
        assert result.recall_at_k == 0.0
        assert result.mrr == pytest.approx(1 / 3)

    def test_perfect_and_zero_scores(self):
        cases = [EvalCase(question="a", must_contain=("x",))]
        assert summarize_method("m", [["x"]], cases, 1).recall_at_k == 1.0
        assert summarize_method("m", [["y"]], cases, 1).recall_at_k == 0.0

    def test_no_cases_yields_zeros_rather_than_dividing_by_zero(self):
        result = summarize_method("m", [], [], 5)
        assert result.recall_at_k == 0.0
        assert result.mrr == 0.0
        assert result.case_count == 0

    def test_missing_ranked_entry_is_treated_as_retrieved_nothing(self):
        cases = [
            EvalCase(question="a", must_contain=("x",)),
            EvalCase(question="b", must_contain=("y",)),
        ]
        result = summarize_method("m", [["x"]], cases, 5)  # only one entry for two cases
        assert result.recall_at_k == 0.5
        assert result.misses == ("b",)

    def test_metadata_is_carried_through(self):
        cases = [EvalCase(question="a", must_contain=("x",))]
        result = summarize_method("my-method", [["x"]], cases, 3)
        assert result.method == "my-method"
        assert result.k == 3
        assert result.case_count == 1


class TestEvalCaseFromDict:
    def test_reads_camel_case_json_keys(self):
        case = EvalCase.from_dict(
            {"question": "q", "mustContain": ["a"], "anyOf": ["b", "c"]}
        )
        assert case.question == "q"
        assert case.must_contain == ("a",)
        assert case.any_of == ("b", "c")

    def test_absent_criteria_default_to_empty(self):
        case = EvalCase.from_dict({"question": "q"})
        assert case.must_contain == ()
        assert case.any_of == ()

    def test_null_criteria_are_treated_as_absent(self):
        case = EvalCase.from_dict({"question": "q", "mustContain": None, "anyOf": None})
        assert case.must_contain == ()
        assert case.any_of == ()

    def test_missing_question_key_raises(self):
        with pytest.raises(KeyError):
            EvalCase.from_dict({"mustContain": ["a"]})
