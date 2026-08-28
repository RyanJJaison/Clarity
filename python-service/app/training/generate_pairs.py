"""Generate synthetic re-ranker training data with the Gemini API.

There is no real usage data yet (no logged student questions paired with the
chunks that answered them), so we bootstrap: for each chunk of real course
content, ask Gemini to write plausible student questions that the chunk answers.
Each question is then paired with its source chunk (the positive) and a
different, non-answering chunk (the negative), producing
``(question, correct_chunk, wrong_chunk)`` triples for
``app/training/train_reranker.py``.

Requires ``GEMINI_API_KEY`` in the environment. Never hardcode the key.

Malformed model output is skipped rather than fatal: a run over hundreds of
chunks should not die because one response came back as prose instead of JSON.
Every skip is counted and reported so silent data loss is visible.

Usage:
    python -m app.training.generate_pairs --source data/eval/retrieval-eval-set.json
    python -m app.training.generate_pairs --source notes.txt --out data/training/pairs.jsonl
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Protocol, Sequence

from app.chunking import Chunk, chunk_text
from app.env import load_env_file

# gemini-2.5-flash is retired for new API users (the API returns 404 pointing
# here), and gemini-3.7-flash was returning 503 under load at time of writing.
# Override with --model if a newer flash model is available to you.
DEFAULT_MODEL = "gemini-3.6-flash"
DEFAULT_QUESTIONS_PER_CHUNK = 3
DEFAULT_NEGATIVES_PER_QUESTION = 1

PROMPT_TEMPLATE = """\
You are helping build training data for a study-assistant retrieval system.

Below is one excerpt from a set of course notes. Write {n} distinct questions a \
student might realistically ask that THIS excerpt answers.

Rules:
- Each question must be answerable from the excerpt alone.
- Vary the phrasing and specificity: mix short keyword-style questions with \
full natural-sentence questions.
- Do not mention "the excerpt", "the text", or "the passage" in the questions.
- Respond with ONLY a JSON array of strings. No markdown fences, no commentary.

Excerpt:
\"\"\"
{chunk}
\"\"\"
"""


@dataclass(frozen=True)
class Triple:
    """One training example: a question, a chunk that answers it, and one that doesn't."""

    question: str
    correct_chunk: str
    wrong_chunk: str


class GeminiClient(Protocol):
    """Minimal contract this module needs from a text-generation client.

    Narrow on purpose: tests inject a fake implementing just this, so they need
    neither the google-genai package nor an API key.
    """

    def generate(self, prompt: str) -> str: ...


class RealGeminiClient:
    """:class:`GeminiClient` backed by the google-genai SDK.

    Imports the SDK lazily so this module can be imported (and tested) without
    google-genai installed.
    """

    def __init__(self, model: str = DEFAULT_MODEL, api_key: str | None = None) -> None:
        key = api_key or os.environ.get("GEMINI_API_KEY")
        if not key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Export it in your environment; "
                "do not hardcode it in source."
            )

        try:
            from google import genai
        except ImportError as exc:  # pragma: no cover - depends on environment
            raise ImportError(
                "RealGeminiClient requires google-genai. "
                "Install it with: pip install google-genai"
            ) from exc

        self.model = model
        self._client = genai.Client(api_key=key)

    def generate(self, prompt: str) -> str:
        response = self._client.models.generate_content(
            model=self.model, contents=prompt
        )
        return response.text or ""


def parse_questions(raw: str) -> list[str]:
    """Extract a list of question strings from a model response.

    Tolerates the common ways an LLM deviates from "return only JSON": markdown
    code fences, and leading or trailing prose around the array. Returns an
    empty list when nothing usable is found — callers treat that as a skip.
    """
    if not raw or not raw.strip():
        return []

    text = raw.strip()

    # Strip ```json ... ``` or ``` ... ``` fences.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()

    candidates = [text]
    # Fall back to the outermost [...] span if there is prose around it.
    bracketed = re.search(r"\[.*\]", text, re.DOTALL)
    if bracketed and bracketed.group(0) != text:
        candidates.append(bracketed.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            continue

        if not isinstance(parsed, list):
            continue

        questions = [
            item.strip()
            for item in parsed
            if isinstance(item, str) and item.strip()
        ]
        if questions:
            return questions

    return []


def pick_negatives(
    chunks: Sequence[Chunk],
    positive_index: int,
    count: int,
    rng: random.Random,
) -> list[str]:
    """Pick ``count`` chunks other than the positive, to serve as negatives.

    Random rather than hard-negative mining: with no trained model yet there is
    nothing to mine "confusingly similar" negatives with. Adjacent chunks share
    overlap text with the positive, which would make for noisy labels, so they
    are not treated specially — sampling uniformly over the rest of the corpus
    keeps this simple and unbiased.
    """
    others = [i for i in range(len(chunks)) if i != positive_index]
    if not others:
        return []
    count = min(count, len(others))
    return [chunks[i].text for i in rng.sample(others, count)]


@dataclass
class GenerationStats:
    """Counts for reporting what a run actually produced and lost."""

    chunks_seen: int = 0
    chunks_failed: int = 0
    chunks_unparseable: int = 0
    questions: int = 0
    triples: int = 0


def generate_triples(
    chunks: Sequence[Chunk],
    client: GeminiClient,
    *,
    questions_per_chunk: int = DEFAULT_QUESTIONS_PER_CHUNK,
    negatives_per_question: int = DEFAULT_NEGATIVES_PER_QUESTION,
    rng: random.Random | None = None,
    on_warning: Callable[[str], None] | None = None,
) -> tuple[list[Triple], GenerationStats]:
    """Generate training triples for every chunk.

    A chunk whose response errors or cannot be parsed is skipped and counted;
    it never aborts the run. Needs at least 2 chunks, since a single-chunk
    corpus has no possible negative.
    """
    rng = rng or random.Random(0)
    warn = on_warning or (lambda msg: print(msg, file=sys.stderr))

    if len(chunks) < 2:
        raise ValueError(
            "need at least 2 chunks to form (correct, wrong) pairs; "
            f"got {len(chunks)}"
        )

    triples: list[Triple] = []
    stats = GenerationStats()

    for index, chunk in enumerate(chunks):
        stats.chunks_seen += 1
        prompt = PROMPT_TEMPLATE.format(n=questions_per_chunk, chunk=chunk.text)

        try:
            raw = client.generate(prompt)
        except Exception as exc:  # noqa: BLE001 - one bad call must not kill the run
            stats.chunks_failed += 1
            warn(f"  chunk {index}: request failed, skipping ({type(exc).__name__}: {exc})")
            continue

        questions = parse_questions(raw)
        if not questions:
            stats.chunks_unparseable += 1
            preview = (raw or "").strip().replace("\n", " ")[:80]
            warn(f'  chunk {index}: could not parse questions, skipping (got: "{preview}")')
            continue

        for question in questions:
            stats.questions += 1
            for wrong in pick_negatives(chunks, index, negatives_per_question, rng):
                triples.append(
                    Triple(question=question, correct_chunk=chunk.text, wrong_chunk=wrong)
                )

    stats.triples = len(triples)
    return triples, stats


def load_source_text(path: Path) -> str:
    """Read source content from a plain text file or an eval-set JSON file."""
    if path.suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if "sourceText" not in data:
            raise ValueError(f"{path} has no 'sourceText' key")
        return data["sourceText"]
    return path.read_text(encoding="utf-8")


def write_jsonl(triples: Sequence[Triple], path: Path) -> None:
    """Write triples as JSON Lines, creating parent directories as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        for triple in triples:
            fh.write(json.dumps(asdict(triple), ensure_ascii=False) + "\n")


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        required=True,
        help="course content: a .txt file, or a .json eval set with a sourceText key",
    )
    parser.add_argument(
        "--out", default="data/training/pairs.jsonl", help="output JSONL path"
    )
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Gemini model id")
    parser.add_argument(
        "--questions-per-chunk", type=int, default=DEFAULT_QUESTIONS_PER_CHUNK
    )
    parser.add_argument(
        "--negatives-per-question", type=int, default=DEFAULT_NEGATIVES_PER_QUESTION
    )
    parser.add_argument("--seed", type=int, default=0, help="seed for negative sampling")
    parser.add_argument(
        "--no-env-file",
        action="store_true",
        help="skip loading .env.local (use the ambient environment only)",
    )
    args = parser.parse_args(argv)

    # Pick up GEMINI_API_KEY from .env.local, matching where the Next.js side
    # keeps its keys. Real env vars still take precedence.
    if not args.no_env_file:
        load_env_file()

    source_path = Path(args.source)
    if not source_path.exists():
        print(f"Source not found: {source_path}", file=sys.stderr)
        return 1

    chunks = chunk_text(load_source_text(source_path))
    print(f"Chunked source into {len(chunks)} chunks.")

    try:
        client: GeminiClient = RealGeminiClient(model=args.model)
    except (RuntimeError, ImportError) as exc:
        print(f"Cannot start generation: {exc}", file=sys.stderr)
        return 1

    print(f"Generating with {args.model}...")
    triples, stats = generate_triples(
        chunks,
        client,
        questions_per_chunk=args.questions_per_chunk,
        negatives_per_question=args.negatives_per_question,
        rng=random.Random(args.seed),
    )

    if not triples:
        print("No triples generated — nothing written.", file=sys.stderr)
        return 1

    out_path = Path(args.out)
    write_jsonl(triples, out_path)

    skipped = stats.chunks_failed + stats.chunks_unparseable
    print(
        f"\nWrote {stats.triples} triples from {stats.questions} questions to {out_path}."
    )
    print(
        f"Chunks: {stats.chunks_seen} seen, {skipped} skipped "
        f"({stats.chunks_failed} request errors, {stats.chunks_unparseable} unparseable)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
