"""Tests for chunking, including parity with the TypeScript port."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.chunking import CHUNK_SIZE_CHARS, OVERLAP_CHARS, chunk_text


def test_empty_and_whitespace_only_text_yields_no_chunks():
    assert chunk_text("") == []
    assert chunk_text("   \n\t  ") == []


def test_short_text_is_a_single_chunk():
    chunks = chunk_text("Mitochondria make ATP.")
    assert len(chunks) == 1
    assert chunks[0].text == "Mitochondria make ATP."
    assert chunks[0].position == 0


def test_whitespace_runs_are_collapsed():
    chunks = chunk_text("a\n\n\nb   c\td")
    assert chunks[0].text == "a b c d"


def test_positions_are_sequential():
    chunks = chunk_text("x" * 5000)
    assert [c.position for c in chunks] == list(range(len(chunks)))


def test_chunks_overlap_by_the_configured_amount():
    text = "".join(str(i % 10) for i in range(5000))
    chunks = chunk_text(text)

    assert len(chunks) > 1
    first_tail = chunks[0].text[-OVERLAP_CHARS:]
    second_head = chunks[1].text[:OVERLAP_CHARS]
    assert first_tail == second_head


def test_no_chunk_exceeds_chunk_size():
    chunks = chunk_text("y" * 9000)
    assert all(len(c.text) <= CHUNK_SIZE_CHARS for c in chunks)


def test_text_exactly_chunk_size_is_one_chunk():
    chunks = chunk_text("z" * CHUNK_SIZE_CHARS)
    assert len(chunks) == 1


def test_full_text_is_recoverable_from_overlapping_chunks():
    text = "".join(str(i % 7) for i in range(4321))
    chunks = chunk_text(text)

    rebuilt = chunks[0].text
    for chunk in chunks[1:]:
        rebuilt += chunk.text[OVERLAP_CHARS:]
    assert rebuilt == text


@pytest.mark.parametrize(
    "chunk_size,overlap",
    [(0, 0), (-1, 0), (100, -1), (100, 100), (100, 200)],
)
def test_invalid_parameters_are_rejected(chunk_size, overlap):
    with pytest.raises(ValueError):
        chunk_text("some text", chunk_size=chunk_size, overlap=overlap)


def test_matches_typescript_chunk_count_on_the_shared_eval_set():
    """The Node harness reports 3 chunks for this file; the port must agree.

    Guards against the two implementations silently drifting, which would make
    their eval numbers incomparable.
    """
    path = Path(__file__).resolve().parents[2] / "data" / "eval" / "retrieval-eval-set.json"
    source = json.loads(path.read_text(encoding="utf-8"))["sourceText"]

    chunks = chunk_text(source)
    assert len(chunks) == 3
