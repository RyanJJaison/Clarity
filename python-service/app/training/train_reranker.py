"""Fine-tune a cross-encoder re-ranker on synthetic triples.

Starts from the pretrained base model (``cross-encoder/ms-marco-MiniLM-L-6-v2``
by default) and fine-tunes it — it does not train from scratch. That matters: the
synthetic dataset is small (a few hundred to a few thousand triples), far too
little to learn relevance from nothing, but enough to adapt a model that already
understands query/passage relevance to this course material.

Each ``(question, correct_chunk, wrong_chunk)`` triple becomes two labelled
pairs: ``(question, correct) -> 1.0`` and ``(question, wrong) -> 0.0``.

A validation split is held out and pairwise accuracy is reported at the end:
the fraction of held-out triples where the model scores the correct chunk above
the wrong one. That is the metric that actually matters for re-ranking, since
re-ranking only cares about relative order, not calibrated scores.

Splitting is grouped by question, so paraphrases of the same source chunk cannot
straddle the train/validation boundary and inflate the reported accuracy.

Requires sentence-transformers and torch:
    pip install sentence-transformers

Usage:
    python -m app.training.train_reranker --pairs data/training/pairs.jsonl
    python -m app.training.train_reranker --pairs pairs.jsonl --epochs 2 --out models/reranker
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from app.reranker import DEFAULT_MODEL, Scorer

DEFAULT_OUT = "models/reranker"
DEFAULT_EPOCHS = 2
DEFAULT_BATCH_SIZE = 16
DEFAULT_VAL_FRACTION = 0.2


@dataclass(frozen=True)
class Triple:
    """One training triple loaded from JSONL."""

    question: str
    correct_chunk: str
    wrong_chunk: str


def load_triples(path: Path) -> list[Triple]:
    """Load triples from JSONL, skipping malformed or incomplete lines."""
    triples: list[Triple] = []
    skipped = 0

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            triples.append(
                Triple(
                    question=data["question"],
                    correct_chunk=data["correct_chunk"],
                    wrong_chunk=data["wrong_chunk"],
                )
            )
        except (json.JSONDecodeError, KeyError, TypeError):
            skipped += 1

    if skipped:
        print(f"⚠ Skipped {skipped} malformed line(s) in {path}.", file=sys.stderr)

    return triples


def split_triples(
    triples: Sequence[Triple],
    val_fraction: float = DEFAULT_VAL_FRACTION,
    seed: int = 0,
) -> tuple[list[Triple], list[Triple]]:
    """Split into (train, validation), grouping all triples of a question together.

    Grouping by question prevents leakage: the generator produces several
    triples per question (one per negative), and putting some in train and
    others in validation would let the model be scored on near-duplicates of
    what it just memorised.
    """
    if not 0.0 <= val_fraction < 1.0:
        raise ValueError("val_fraction must be in [0.0, 1.0)")
    if not triples:
        return [], []

    by_question: dict[str, list[Triple]] = {}
    for triple in triples:
        by_question.setdefault(triple.question, []).append(triple)

    questions = sorted(by_question)
    random.Random(seed).shuffle(questions)

    n_val = int(len(questions) * val_fraction)
    # With a tiny dataset, still hold out at least one question if asked to.
    if val_fraction > 0 and n_val == 0 and len(questions) > 1:
        n_val = 1

    val_questions = set(questions[:n_val])

    train = [t for q in questions if q not in val_questions for t in by_question[q]]
    val = [t for q in questions if q in val_questions for t in by_question[q]]
    return train, val


def pairwise_accuracy(triples: Sequence[Triple], scorer: Scorer) -> float:
    """Fraction of triples where the correct chunk outscores the wrong one.

    Ties count as failures — a model that cannot separate the two has not
    learned the ordering. Returns 0.0 for an empty set.
    """
    if not triples:
        return 0.0

    correct = 0
    for triple in triples:
        scores = list(scorer(triple.question, [triple.correct_chunk, triple.wrong_chunk]))
        if len(scores) != 2:
            raise ValueError(f"scorer returned {len(scores)} scores, expected 2")
        if scores[0] > scores[1]:
            correct += 1

    return correct / len(triples)


def to_labeled_pairs(triples: Sequence[Triple]) -> list[tuple[str, str, float]]:
    """Expand each triple into a positive and a negative labelled pair."""
    pairs: list[tuple[str, str, float]] = []
    for triple in triples:
        pairs.append((triple.question, triple.correct_chunk, 1.0))
        pairs.append((triple.question, triple.wrong_chunk, 0.0))
    return pairs


def train(
    triples: Sequence[Triple],
    *,
    base_model: str = DEFAULT_MODEL,
    out_dir: str = DEFAULT_OUT,
    epochs: int = DEFAULT_EPOCHS,
    batch_size: int = DEFAULT_BATCH_SIZE,
    val_fraction: float = DEFAULT_VAL_FRACTION,
    seed: int = 0,
) -> dict:
    """Fine-tune the base cross-encoder and report validation accuracy.

    Imports sentence-transformers lazily so this module stays importable (and
    the pure functions above stay testable) in environments without torch.

    Returns a summary dict with the pre- and post-training validation accuracy,
    so you can see whether fine-tuning actually helped rather than assuming it.
    """
    try:
        from sentence_transformers import CrossEncoder, InputExample
        from torch.utils.data import DataLoader
    except ImportError as exc:  # pragma: no cover - depends on environment
        raise ImportError(
            "Training requires sentence-transformers and torch. "
            "Install them with: pip install sentence-transformers"
        ) from exc

    train_triples, val_triples = split_triples(triples, val_fraction, seed)
    if not train_triples:
        raise ValueError("no training triples after split")

    print(
        f"Loaded {len(triples)} triples: "
        f"{len(train_triples)} train, {len(val_triples)} validation."
    )
    print(f"Fine-tuning from pretrained base: {base_model}")

    # num_labels=1 makes this a regression-style relevance scorer, which is what
    # a re-ranker needs (a single score per pair, not a class distribution).
    model = CrossEncoder(base_model, num_labels=1)

    def scorer(query: str, texts: Sequence[str]) -> list[float]:
        return [float(s) for s in model.predict([(query, t) for t in texts])]

    baseline = pairwise_accuracy(val_triples, scorer) if val_triples else 0.0
    if val_triples:
        print(f"Validation pairwise accuracy BEFORE fine-tuning: {baseline:.1%}")

    examples = [
        InputExample(texts=[query, passage], label=label)
        for query, passage, label in to_labeled_pairs(train_triples)
    ]
    loader = DataLoader(examples, shuffle=True, batch_size=batch_size)

    warmup_steps = max(1, int(len(loader) * epochs * 0.1))
    model.fit(
        train_dataloader=loader,
        epochs=epochs,
        warmup_steps=warmup_steps,
        output_path=out_dir,
    )

    final = pairwise_accuracy(val_triples, scorer) if val_triples else 0.0

    print(f"\nSaved fine-tuned model to {out_dir}")
    if val_triples:
        print(f"Validation pairwise accuracy AFTER fine-tuning:  {final:.1%}")
        print(f"Change: {final - baseline:+.1%} on {len(val_triples)} held-out triples")
    else:
        print("⚠ No validation split (dataset too small) — accuracy not measured.")

    return {
        "base_model": base_model,
        "out_dir": out_dir,
        "train_triples": len(train_triples),
        "val_triples": len(val_triples),
        "accuracy_before": baseline,
        "accuracy_after": final,
    }


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pairs", required=True, help="JSONL of triples from generate_pairs")
    parser.add_argument("--base-model", default=DEFAULT_MODEL, help="pretrained base model")
    parser.add_argument("--out", default=DEFAULT_OUT, help="where to save the checkpoint")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--val-fraction", type=float, default=DEFAULT_VAL_FRACTION)
    parser.add_argument("--seed", type=int, default=0)
    args = parser.parse_args(argv)

    pairs_path = Path(args.pairs)
    if not pairs_path.exists():
        print(f"Pairs file not found: {pairs_path}", file=sys.stderr)
        return 1

    triples = load_triples(pairs_path)
    if not triples:
        print(f"No usable triples in {pairs_path}.", file=sys.stderr)
        return 1

    try:
        train(
            triples,
            base_model=args.base_model,
            out_dir=args.out,
            epochs=args.epochs,
            batch_size=args.batch_size,
            val_fraction=args.val_fraction,
            seed=args.seed,
        )
    except ImportError as exc:
        print(f"{exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
