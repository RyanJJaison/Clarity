"""Tests for the eval harness, including the re-ranking method.

Uses an injected semantic embedder and fake scorers, so nothing here needs a
Voyage key, a Gemini key, or a downloaded cross-encoder.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.chunking import Chunk
from app.eval_metrics import EvalCase, summarize_method
from app.eval_retrieval import (
    build_scorer,
    format_table,
    load_eval_file,
    main,
    rank_all_methods,
)
from app.tests.conftest import ConstantScorer, KeywordOverlapScorer, semantic_embed

EVAL_SET = Path(__file__).resolve().parents[2] / "data" / "eval" / "retrieval-eval-set.json"


@pytest.fixture
def cases() -> list[EvalCase]:
    return [
        EvalCase(question="what do mitochondria do", must_contain=("powerhouse",)),
        EvalCase(question="why are plants green", must_contain=("chlorophyll",)),
    ]


class TestRankAllMethods:
    def test_produces_the_three_baseline_methods_without_a_scorer(self, sample_chunks, cases):
        result = rank_all_methods(sample_chunks, cases, embed_fn=semantic_embed)
        assert set(result) == {"vector-only", "keyword-only", "hybrid (RRF)"}

    def test_adds_the_rerank_method_only_when_a_scorer_is_given(self, sample_chunks, cases):
        result = rank_all_methods(
            sample_chunks, cases, scorer=ConstantScorer(), embed_fn=semantic_embed
        )
        assert "hybrid + rerank" in result

    def test_every_method_ranks_the_full_corpus_for_every_case(self, sample_chunks, cases):
        result = rank_all_methods(
            sample_chunks, cases, scorer=ConstantScorer(), embed_fn=semantic_embed
        )
        for method, per_case in result.items():
            assert len(per_case) == len(cases), method
            for ranked in per_case:
                assert len(ranked) == len(sample_chunks), method

    def test_rankings_are_permutations_with_no_duplicates(self, sample_chunks, cases):
        result = rank_all_methods(
            sample_chunks, cases, scorer=KeywordOverlapScorer(), embed_fn=semantic_embed
        )
        expected = {c.text for c in sample_chunks}
        for method, per_case in result.items():
            for ranked in per_case:
                assert set(ranked) == expected, method
                assert len(set(ranked)) == len(ranked), method

    def test_keyword_retrieval_finds_the_obviously_matching_chunk(self, sample_chunks, cases):
        result = rank_all_methods(sample_chunks, cases, embed_fn=semantic_embed)
        # "what do mitochondria do" -> the mitochondria chunk should rank first.
        assert "Mitochondria" in result["keyword-only"][0][0]

    def test_reranker_sees_only_the_top_candidates(self, sample_chunks, cases):
        """The whole point: re-ranking must not scan the full corpus."""
        scorer = KeywordOverlapScorer()
        rank_all_methods(
            sample_chunks,
            cases,
            scorer=scorer,
            rerank_candidates=2,
            embed_fn=semantic_embed,
        )
        assert scorer.calls, "scorer was never called"
        for _query, texts in scorer.calls:
            assert len(texts) == 2

    def test_untouched_tail_is_preserved_after_the_reranked_head(self, sample_chunks, cases):
        """Keeps the ranking a full permutation so MRR stays comparable."""
        result = rank_all_methods(
            sample_chunks,
            cases,
            scorer=ConstantScorer(),
            rerank_candidates=2,
            embed_fn=semantic_embed,
        )
        hybrid = result["hybrid (RRF)"][0]
        reranked = result["hybrid + rerank"][0]
        # A constant scorer preserves order, so with a stable tail the whole
        # list should be unchanged.
        assert reranked == hybrid

    def test_reranking_can_reorder_the_head(self, sample_chunks):
        """A scorer that disagrees with hybrid must actually change the order."""
        case = EvalCase(question="acidic digestive enzymes", must_contain=("lysosomes",))

        # Reverse the head ordering, so any reordering is visible.
        def reversing_scorer(query, texts):
            return [float(i) for i in range(len(texts))]

        result = rank_all_methods(
            [Chunk(text=t, position=i) for i, t in enumerate(["aaa", "bbb", "ccc", "ddd"])],
            [case],
            scorer=reversing_scorer,
            rerank_candidates=3,
            embed_fn=semantic_embed,
        )
        hybrid_head = result["hybrid (RRF)"][0][:3]
        reranked_head = result["hybrid + rerank"][0][:3]
        assert reranked_head == list(reversed(hybrid_head))

    def test_rerank_candidates_larger_than_corpus_is_harmless(self, sample_chunks, cases):
        result = rank_all_methods(
            sample_chunks,
            cases,
            scorer=ConstantScorer(),
            rerank_candidates=999,
            embed_fn=semantic_embed,
        )
        assert len(result["hybrid + rerank"][0]) == len(sample_chunks)

    def test_reranked_recall_cannot_exceed_hybrid_recall_at_candidate_depth(
        self, sample_chunks
    ):
        """Re-ranking reorders; it cannot retrieve what stage one missed."""
        case = EvalCase(question="ribosomes proteins", must_contain=("Ribosomes",))
        depth = 2

        result = rank_all_methods(
            sample_chunks,
            [case],
            scorer=KeywordOverlapScorer(),
            rerank_candidates=depth,
            embed_fn=semantic_embed,
        )

        hybrid_at_depth = summarize_method("h", result["hybrid (RRF)"], [case], depth)
        reranked_at_depth = summarize_method("r", result["hybrid + rerank"], [case], depth)
        assert reranked_at_depth.recall_at_k <= hybrid_at_depth.recall_at_k

    def test_no_cases_yields_empty_per_method_lists(self, sample_chunks):
        result = rank_all_methods(sample_chunks, [], embed_fn=semantic_embed)
        assert all(v == [] for v in result.values())


class TestLoadEvalFile:
    def test_reads_source_text_and_cases(self):
        source, cases = load_eval_file(EVAL_SET)
        assert isinstance(source, str) and source
        assert len(cases) == 14
        assert all(isinstance(c, EvalCase) for c in cases)

    def test_parses_the_any_of_case_in_the_shared_eval_set(self):
        _source, cases = load_eval_file(EVAL_SET)
        any_of_cases = [c for c in cases if c.any_of]
        assert len(any_of_cases) == 1
        assert any_of_cases[0].any_of == ("ribosome", "translate")

    def test_missing_file_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            load_eval_file(tmp_path / "nope.json")


class TestBuildScorer:
    def test_none_model_means_no_scorer_and_no_error(self):
        scorer, error = build_scorer(None)
        assert scorer is None
        assert error is None

    def test_unloadable_model_reports_the_reason_instead_of_raising(self):
        """The harness must skip the method, not crash or fake a score."""
        scorer, error = build_scorer("definitely-not-a-real-model-name-xyz")
        assert scorer is None
        assert error


class TestFormatTable:
    def test_renders_a_row_per_method(self, cases):
        results = [
            summarize_method("vector-only", [["powerhouse"], ["x"]], cases, 3),
            summarize_method("hybrid + rerank", [["powerhouse"], ["chlorophyll"]], cases, 3),
        ]
        table = format_table(results)
        assert "vector-only" in table
        assert "hybrid + rerank" in table
        assert "recall@3" in table

    def test_formats_recall_as_a_percentage_and_mrr_to_three_places(self, cases):
        results = [summarize_method("m", [["powerhouse"], ["chlorophyll"]], cases, 3)]
        table = format_table(results)
        assert "100%" in table
        assert "1.000" in table

    def test_empty_results_do_not_crash(self):
        assert format_table([])


class TestMain:
    def test_runs_end_to_end_and_reports_the_trivial_k_warning(self, capsys):
        """The bundled eval set has 3 chunks, so k=3 retrieves everything."""
        exit_code = main(["--file", str(EVAL_SET), "--k", "3"])
        out = capsys.readouterr().out

        assert exit_code == 0
        assert "vector-only" in out
        assert "keyword-only" in out
        assert "hybrid (RRF)" in out
        assert "trivially 100%" in out

    def test_skips_the_rerank_method_when_no_model_is_requested(self, capsys):
        main(["--file", str(EVAL_SET), "--k", "1"])
        out = capsys.readouterr().out
        assert "re-ranking method is skipped" in out
        assert "hybrid + rerank" not in out

    def test_warns_when_embeddings_are_mocked(self, capsys, monkeypatch):
        monkeypatch.delenv("VOYAGE_API_KEY", raising=False)
        main(["--file", str(EVAL_SET), "--k", "1"])
        assert "NOT meaningful" in capsys.readouterr().out

    def test_missing_file_exits_nonzero(self, tmp_path, capsys):
        assert main(["--file", str(tmp_path / "missing.json")]) == 1
        assert "not found" in capsys.readouterr().err

    def test_unloadable_reranker_model_is_reported_not_faked(self, tmp_path, capsys):
        exit_code = main(
            ["--file", str(EVAL_SET), "--k", "1", "--reranker-model", "not-a-real-model-xyz"]
        )
        out = capsys.readouterr().out
        assert exit_code == 0
        assert "Could not load re-ranker" in out
        assert "hybrid + rerank" not in out

    def test_smaller_k_does_not_emit_the_trivial_warning(self, tmp_path, capsys):
        # Build a source long enough to exceed k chunks.
        long_source = " ".join(f"sentence number {i} about cells." for i in range(600))
        eval_file = tmp_path / "eval.json"
        eval_file.write_text(
            json.dumps(
                {"sourceText": long_source, "cases": [{"question": "cells", "mustContain": ["cells"]}]}
            ),
            encoding="utf-8",
        )
        main(["--file", str(eval_file), "--k", "2"])
        assert "trivially 100%" not in capsys.readouterr().out
