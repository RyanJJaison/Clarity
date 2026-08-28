"""Embeddings — a port of ``lib/embeddings.ts``.

Falls back to deterministic mock vectors when ``VOYAGE_API_KEY`` is unset so the
eval harness and tests run end-to-end without a key. Mock vectors carry no
semantic signal, so any recall/MRR measured against them is meaningless — the
harness prints a loud warning in that case.
"""

from __future__ import annotations

import math
import os
from typing import Sequence

VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
MODEL = "voyage-3"
EMBEDDING_DIM = 1024


def is_mocked() -> bool:
    """True when no Voyage key is configured, so ``embed`` returns mock vectors.

    Read at call time rather than import time so tests can monkeypatch the env.
    """
    return not os.environ.get("VOYAGE_API_KEY")


def embed(texts: Sequence[str]) -> list[list[float]]:
    """Embed a batch of texts, via Voyage when keyed and mock vectors otherwise."""
    if not texts:
        return []

    if is_mocked():
        return [mock_embedding(t) for t in texts]

    import httpx

    response = httpx.post(
        VOYAGE_URL,
        headers={
            "Authorization": f"Bearer {os.environ['VOYAGE_API_KEY']}",
            "Content-Type": "application/json",
        },
        json={"input": list(texts), "model": MODEL, "input_type": "document"},
        timeout=60.0,
    )
    if response.status_code != 200:
        raise RuntimeError(
            f"Voyage embeddings request failed: {response.status_code} {response.text}"
        )

    payload = response.json()
    return [item["embedding"] for item in payload["data"]]


def mock_embedding(text: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """Deterministic hash-based pseudo-embedding.

    Not semantically meaningful — only good enough to keep the pipeline
    running without a key. Mirrors the TypeScript mock so both harnesses
    behave the same way when unkeyed.
    """
    vec = [0.0] * dim
    for i, ch in enumerate(text):
        vec[i % dim] += ord(ch)

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]
