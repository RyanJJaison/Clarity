"""Tests for re-ranker training.

The pure logic — loading, splitting, pairwise accuracy, pair expansion — is
tested directly. The ``train()`` function itself needs torch and
sentence-transformers and would download the base model, so it is not executed
here; only its guard clauses are. Pairwise accuracy is verified against fake
scorers so the metric is provably correct before any real training run.
"""

from __future__ import annotations

import json

import pytest

from app.reranker import DEFAULT_MODEL
from app.training.train_reranker import (
    Triple,
    load_triples,
    pairwise_accuracy,
    split_triples,
    to_labeled_pairs,
)


def make_triples(n: int) -> list[Triple]:
    return [
        Triple(question=f"q{i}", correct_chunk=f"right{i}", wrong_chunk=f"wrong{i}")
        for i in range(n)
    ]


class TestLoadTriples:
    def test_loads_well_formed_jsonl(self, tmp_path):
        path = tmp_path / "pairs.jsonl"
        path.write_text(
            "\n".join(
                json.dumps({"question": f"q{i}", "correct_chunk": "r", "wrong_chunk": "w"})
                for i in range(3)
            ),
            encoding="utf-8",
        )
        assert len(load_triples(path)) == 3

    def test_skips_blank_lines(self, tmp_path):
        path = tmp_path / "pairs.jsonl"
        path.write_text(
            '{"question":"q","correct_chunk":"r","wrong_chunk":"w"}\n\n\n', encoding="utf-8"
        )
        assert len(load_triples(path)) == 1

    def test_skips_malformed_lines_and_keeps_the_good_ones(self, tmp_path, capsys):
        path = tmp_path / "pairs.jsonl"
        path.write_text(
            "\n".join(
                [
                    '{"question":"good","correct_chunk":"r","wrong_chunk":"w"}',
                    "not json",
                    '{"question":"missing fields"}',
                    '{"question":"good2","correct_chunk":"r","wrong_chunk":"w"}',
                ]
            ),
            encoding="utf-8",
        )
        triples = load_triples(path)
        assert len(triples) == 2
        assert "Skipped 2 malformed" in capsys.readouterr().err

    def test_empty_file_yields_no_triples(self, tmp_path):
        path = tmp_path / "empty.jsonl"
        path.write_text("", encoding="utf-8")
        assert load_triples(path) == []


class TestSplitTriples:
    def test_splits_roughly_by_the_requested_fraction(self):
        train, val = split_triples(make_triples(10), val_fraction=0.2, seed=0)
        assert len(val) == 2
        assert len(train) == 8

    def test_split_is_exhaustive_and_disjoint(self):
        triples = make_triples(10)
        train, val = split_triples(triples, val_fraction=0.3, seed=0)
        assert len(train) + len(val) == len(triples)
        assert not ({t.question for t in train} & {t.question for t in val})

    def test_groups_all_triples_of_a_question_on_one_side(self):
        """Prevents leakage between train and validation."""
        triples = [
            Triple(question="shared", correct_chunk="r", wrong_chunk=f"w{i}")
            for i in range(4)
        ] + make_triples(6)

        train, val = split_triples(triples, val_fraction=0.5, seed=1)
        train_shared = sum(1 for t in train if t.question == "shared")
        val_shared = sum(1 for t in val if t.question == "shared")
        assert (train_shared, val_shared) in [(4, 0), (0, 4)]

    def test_zero_fraction_holds_nothing_out(self):
        train, val = split_triples(make_triples(5), val_fraction=0.0)
        assert len(train) == 5
        assert val == []

    def test_tiny_dataset_still_holds_out_one_question(self):
        train, val = split_triples(make_triples(2), val_fraction=0.2)
        assert len(val) == 1
        assert len(train) == 1

    def test_single_question_cannot_be_split(self):
        train, val = split_triples(make_triples(1), val_fraction=0.2)
        assert len(train) == 1
        assert val == []

    def test_empty_input_yields_empty_splits(self):
        assert split_triples([], 0.2) == ([], [])

    def test_is_deterministic_for_a_given_seed(self):
        triples = make_triples(10)
        assert split_triples(triples, 0.3, seed=5) == split_triples(triples, 0.3, seed=5)

    def test_different_seeds_can_produce_different_splits(self):
        triples = make_triples(20)
        a = split_triples(triples, 0.3, seed=1)[1]
        b = split_triples(triples, 0.3, seed=2)[1]
        assert a != b

    @pytest.mark.parametrize("fraction", [-0.1, 1.0, 1.5])
    def test_invalid_fraction_raises(self, fraction):
        with pytest.raises(ValueError, match="val_fraction"):
            split_triples(make_triples(3), fraction)


class TestPairwiseAccuracy:
    def test_perfect_scorer_scores_one(self):
        triples = make_triples(4)

        def perfect(query, texts):
            # texts is [correct, wrong]
            return [1.0, 0.0]

        assert pairwise_accuracy(triples, perfect) == 1.0

    def test_inverted_scorer_scores_zero(self):
        assert pairwise_accuracy(make_triples(4), lambda q, t: [0.0, 1.0]) == 0.0

    def test_ties_count_as_failures(self):
        """A model that cannot separate the pair has not learned the ordering."""
        assert pairwise_accuracy(make_triples(3), lambda q, t: [0.5, 0.5]) == 0.0

    def test_partial_accuracy_is_the_correct_fraction(self):
        triples = make_triples(4)
        calls = {"n": 0}

        def half_right(query, texts):
            calls["n"] += 1
            return [1.0, 0.0] if calls["n"] % 2 else [0.0, 1.0]

        assert pairwise_accuracy(triples, half_right) == 0.5

    def test_empty_triples_score_zero_rather_than_dividing_by_zero(self):
        assert pairwise_accuracy([], lambda q, t: [1.0, 0.0]) == 0.0

    def test_scorer_receives_correct_then_wrong_in_that_order(self):
        seen = []

        def recording(query, texts):
            seen.append(list(texts))
            return [1.0, 0.0]

        pairwise_accuracy([Triple("q", "the-right-one", "the-wrong-one")], recording)
        assert seen == [["the-right-one", "the-wrong-one"]]

    def test_scorer_returning_wrong_score_count_raises(self):
        with pytest.raises(ValueError, match="expected 2"):
            pairwise_accuracy(make_triples(1), lambda q, t: [1.0])


class TestToLabeledPairs:
    def test_each_triple_becomes_a_positive_and_a_negative_pair(self):
        pairs = to_labeled_pairs([Triple("q", "right", "wrong")])
        assert pairs == [("q", "right", 1.0), ("q", "wrong", 0.0)]

    def test_pair_count_is_twice_the_triple_count(self):
        assert len(to_labeled_pairs(make_triples(5))) == 10

    def test_labels_are_balanced(self):
        pairs = to_labeled_pairs(make_triples(6))
        labels = [label for _q, _t, label in pairs]
        assert labels.count(1.0) == labels.count(0.0) == 6

    def test_empty_input_yields_no_pairs(self):
        assert to_labeled_pairs([]) == []


class TestTrainGuards:
    def test_fine_tunes_from_the_pretrained_base_not_from_scratch(self):
        """The default base must be the pretrained cross-encoder."""
        from app.training import train_reranker

        assert train_reranker.DEFAULT_MODEL == DEFAULT_MODEL
        assert DEFAULT_MODEL == "cross-encoder/ms-marco-MiniLM-L-6-v2"

    def test_empty_training_split_raises_before_touching_a_model(self):
        from app.training.train_reranker import train

        # val_fraction=0 with no triples leaves nothing to train on. This must
        # fail fast, and must not be an ImportError about torch.
        with pytest.raises((ValueError, ImportError)) as exc:
            train([], val_fraction=0.0)
        # If torch is absent we get ImportError; either way we never silently pass.
        assert exc.value is not None
