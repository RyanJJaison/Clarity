"""Text chunking — a direct port of ``chunkText`` in ``lib/rag.ts``.

Kept deliberately in lockstep with the TypeScript implementation: the eval
numbers produced here are only comparable to the Node harness if both split
text identically. If you change the constants or the slicing arithmetic,
change them in ``lib/rag.ts`` too.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

CHUNK_SIZE_CHARS = 2000  # ~500 tokens
OVERLAP_CHARS = 200  # ~50 tokens

_WHITESPACE_RE = re.compile(r"\s+")


@dataclass(frozen=True)
class Chunk:
    """One chunk of source text, with its ordinal position in the document."""

    text: str
    position: int


def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE_CHARS,
    overlap: int = OVERLAP_CHARS,
) -> list[Chunk]:
    """Split raw text into overlapping chunks for embedding.

    Collapses all whitespace runs to single spaces first, matching the
    TypeScript port, so chunk boundaries land on the same characters.
    """
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0:
        raise ValueError("overlap must not be negative")
    if overlap >= chunk_size:
        # Otherwise `start` would not advance and the loop would never end.
        raise ValueError("overlap must be smaller than chunk_size")

    clean = _WHITESPACE_RE.sub(" ", text).strip()
    if not clean:
        return []

    chunks: list[Chunk] = []
    start = 0
    position = 0

    while start < len(clean):
        end = min(start + chunk_size, len(clean))
        chunks.append(Chunk(text=clean[start:end], position=position))
        position += 1
        if end == len(clean):
            break
        start = end - overlap

    return chunks
