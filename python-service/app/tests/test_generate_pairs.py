"""Tests for synthetic training-pair generation.

All Gemini calls go through :class:`~app.tests.conftest.FakeGeminiClient`, so no
network access and no ``GEMINI_API_KEY`` is required. The malformed-response
handling is the main thing under test: one bad response must not abort a run.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import pytest

from app.chunking import Chunk
from app.training.generate_pairs import (
    DEFAULT_MODEL,
    RealGeminiClient,
    Triple,
    generate_triples,
    load_source_text,
    parse_questions,
    pick_negatives,
    write_jsonl,
)
from app.tests.conftest import FakeGeminiClient


class TestParseQuestions:
    def test_parses_a_plain_json_array(self):
        assert parse_questions('["What is ATP?", "Where is it made?"]') == [
            "What is ATP?",
            "Where is it made?",
        ]

    def test_strips_json_code_fences(self):
        raw = '```json\n["What is ATP?"]\n```'
        assert parse_questions(raw) == ["What is ATP?"]

    def test_strips_bare_code_fences(self):
        assert parse_questions('```\n["Q?"]\n```') == ["Q?"]

    def test_extracts_the_array_from_surrounding_prose(self):
        raw = 'Sure! Here are the questions:\n["First?", "Second?"]\nHope that helps.'
        assert parse_questions(raw) == ["First?", "Second?"]

    def test_trims_whitespace_and_drops_blank_entries(self):
        assert parse_questions('["  padded?  ", "", "   "]') == ["padded?"]

    def test_drops_non_string_entries(self):
        assert parse_questions('["good?", 42, null, {"a": 1}]') == ["good?"]

    def test_recovers_the_array_from_a_wrapper_object(self):
        """Salvaging beats discarding: the questions are there, just wrapped.

        The model was told to return a bare array; wrapping it in an object is a
        common deviation. The bracketed-span fallback recovers the array rather
        than throwing the whole chunk away.
        """
        assert parse_questions('{"questions": ["a?", "b?"]}') == ["a?", "b?"]

    @pytest.mark.parametrize(
        "raw",
        [
            "",
            "   ",
            "not json at all",
            "{}",  # object with no array to recover
            "[",  # truncated
            '["unterminated',
            "[]",  # valid but empty
            "[1, 2, 3]",  # array with no strings
            "null",
        ],
    )
    def test_unusable_responses_yield_an_empty_list_rather_than_raising(self, raw):
        assert parse_questions(raw) == []


class TestPickNegatives:
    def test_never_picks_the_positive_chunk(self, sample_chunks):
        rng = random.Random(0)
        for index in range(len(sample_chunks)):
            negatives = pick_negatives(sample_chunks, index, 3, rng)
            assert sample_chunks[index].text not in negatives

    def test_returns_the_requested_count(self, sample_chunks):
        assert len(pick_negatives(sample_chunks, 0, 2, random.Random(0))) == 2

    def test_caps_at_the_available_chunk_count(self, sample_chunks):
        negatives = pick_negatives(sample_chunks, 0, 99, random.Random(0))
        assert len(negatives) == len(sample_chunks) - 1

    def test_single_chunk_corpus_has_no_possible_negative(self):
        assert pick_negatives([Chunk(text="only", position=0)], 0, 1, random.Random(0)) == []

    def test_is_deterministic_for_a_given_seed(self, sample_chunks):
        a = pick_negatives(sample_chunks, 0, 2, random.Random(42))
        b = pick_negatives(sample_chunks, 0, 2, random.Random(42))
        assert a == b


class TestGenerateTriples:
    def test_builds_one_triple_per_question_per_negative(self, sample_chunks):
        client = FakeGeminiClient(['["Q1?", "Q2?"]'] * len(sample_chunks))
        triples, stats = generate_triples(
            sample_chunks, client, negatives_per_question=1, rng=random.Random(0)
        )
        assert stats.questions == 2 * len(sample_chunks)
        assert len(triples) == 2 * len(sample_chunks)

    def test_multiple_negatives_multiply_the_triple_count(self, sample_chunks):
        client = FakeGeminiClient(['["Q1?"]'] * len(sample_chunks))
        triples, _ = generate_triples(
            sample_chunks, client, negatives_per_question=2, rng=random.Random(0)
        )
        assert len(triples) == 2 * len(sample_chunks)

    def test_correct_chunk_is_the_source_chunk_and_wrong_chunk_differs(self, sample_chunks):
        client = FakeGeminiClient(['["Q?"]'] * len(sample_chunks))
        triples, _ = generate_triples(sample_chunks, client, rng=random.Random(0))
        chunk_texts = {c.text for c in sample_chunks}
        for triple in triples:
            assert triple.correct_chunk in chunk_texts
            assert triple.wrong_chunk in chunk_texts
            assert triple.correct_chunk != triple.wrong_chunk

    def test_malformed_response_skips_only_that_chunk(self, sample_chunks):
        """The headline requirement: one bad response must not kill the run."""
        warnings: list[str] = []
        client = FakeGeminiClient(
            ['["Q1?"]', "total garbage, not json", '["Q3?"]', '["Q4?"]']
        )
        triples, stats = generate_triples(
            sample_chunks, client, rng=random.Random(0), on_warning=warnings.append
        )

        assert stats.chunks_seen == 4
        assert stats.chunks_unparseable == 1
        assert stats.questions == 3  # the three good chunks
        assert len(triples) == 3
        assert any("could not parse" in w for w in warnings)

    def test_request_exception_skips_only_that_chunk(self, sample_chunks):
        warnings: list[str] = []
        client = FakeGeminiClient(
            ['["Q1?"]', RuntimeError("503 upstream"), '["Q3?"]', '["Q4?"]']
        )
        triples, stats = generate_triples(
            sample_chunks, client, rng=random.Random(0), on_warning=warnings.append
        )

        assert stats.chunks_failed == 1
        assert stats.chunks_unparseable == 0
        assert len(triples) == 3
        assert any("request failed" in w for w in warnings)

    def test_all_responses_bad_yields_no_triples_but_does_not_raise(self, sample_chunks):
        client = FakeGeminiClient(["junk"] * len(sample_chunks))
        triples, stats = generate_triples(
            sample_chunks, client, rng=random.Random(0), on_warning=lambda _: None
        )
        assert triples == []
        assert stats.chunks_unparseable == len(sample_chunks)

    def test_stats_account_for_every_chunk(self, sample_chunks):
        client = FakeGeminiClient(['["Q?"]', "junk", RuntimeError("boom"), '["Q?"]'])
        _triples, stats = generate_triples(
            sample_chunks, client, rng=random.Random(0), on_warning=lambda _: None
        )
        assert stats.chunks_seen == 4
        assert stats.chunks_failed + stats.chunks_unparseable == 2

    def test_prompt_includes_the_chunk_and_requested_question_count(self, sample_chunks):
        client = FakeGeminiClient(['["Q?"]'] * len(sample_chunks))
        generate_triples(
            sample_chunks, client, questions_per_chunk=7, rng=random.Random(0)
        )
        assert "7 distinct questions" in client.prompts[0]
        assert sample_chunks[0].text in client.prompts[0]

    def test_fewer_than_two_chunks_raises(self):
        client = FakeGeminiClient(['["Q?"]'])
        with pytest.raises(ValueError, match="at least 2 chunks"):
            generate_triples([Chunk(text="only", position=0)], client)

    def test_is_deterministic_for_a_given_seed(self, sample_chunks):
        def run():
            client = FakeGeminiClient(['["Q?"]'] * len(sample_chunks))
            triples, _ = generate_triples(
                sample_chunks, client, negatives_per_question=1, rng=random.Random(7)
            )
            return triples

        assert run() == run()


class TestLoadSourceText:
    def test_reads_a_plain_text_file(self, tmp_path):
        path = tmp_path / "notes.txt"
        path.write_text("some course notes", encoding="utf-8")
        assert load_source_text(path) == "some course notes"

    def test_reads_source_text_from_an_eval_set_json(self, tmp_path):
        path = tmp_path / "eval.json"
        path.write_text(json.dumps({"sourceText": "from json", "cases": []}), encoding="utf-8")
        assert load_source_text(path) == "from json"

    def test_json_without_source_text_raises(self, tmp_path):
        path = tmp_path / "eval.json"
        path.write_text(json.dumps({"cases": []}), encoding="utf-8")
        with pytest.raises(ValueError, match="sourceText"):
            load_source_text(path)


class TestWriteJsonl:
    def test_writes_one_json_object_per_line(self, tmp_path):
        triples = [
            Triple(question="q1", correct_chunk="right1", wrong_chunk="wrong1"),
            Triple(question="q2", correct_chunk="right2", wrong_chunk="wrong2"),
        ]
        path = tmp_path / "nested" / "pairs.jsonl"
        write_jsonl(triples, path)

        lines = path.read_text(encoding="utf-8").strip().split("\n")
        assert len(lines) == 2
        first = json.loads(lines[0])
        assert first == {"question": "q1", "correct_chunk": "right1", "wrong_chunk": "wrong1"}

    def test_creates_parent_directories(self, tmp_path):
        path = tmp_path / "a" / "b" / "c.jsonl"
        write_jsonl([Triple("q", "r", "w")], path)
        assert path.exists()

    def test_preserves_non_ascii_content(self, tmp_path):
        path = tmp_path / "pairs.jsonl"
        write_jsonl([Triple("¿Qué es ATP?", "café", "naïve")], path)
        assert "¿Qué es ATP?" in path.read_text(encoding="utf-8")


class TestRealGeminiClient:
    def test_missing_api_key_raises_a_clear_error(self, monkeypatch):
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        with pytest.raises(RuntimeError, match="GEMINI_API_KEY is not set"):
            RealGeminiClient()

    def test_default_model_is_an_available_gemini_flash(self):
        """gemini-2.5-flash is retired for new API users, so it must not be the default."""
        assert DEFAULT_MODEL == "gemini-3.6-flash"
