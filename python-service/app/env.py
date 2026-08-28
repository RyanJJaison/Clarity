"""Minimal ``.env.local`` loader.

Next.js loads ``.env.local`` automatically for the TypeScript side, so that file
is where this project's keys live. A standalone Python process gets no such
treatment, which makes "I put the key in .env.local but the script says it isn't
set" an easy trap. The CLI entry points call :func:`load_env_file` to close that
gap.

Hand-rolled rather than depending on python-dotenv: the format we need is a few
lines of ``KEY=value``, and one fewer dependency keeps the test suite light.

Real environment variables always win over file values, so an explicit
``export`` or a CI-injected secret is never silently overridden by a stale file.
"""

from __future__ import annotations

import os
from pathlib import Path

# python-service/app/env.py -> python-service/app -> python-service -> repo root
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ENV_FILE = REPO_ROOT / ".env.local"


def parse_env_text(text: str) -> dict[str, str]:
    """Parse ``KEY=value`` lines, skipping blanks and ``#`` comments.

    Tolerates ``export KEY=value``, surrounding quotes, and whitespace around
    the ``=``. Lines without an ``=`` are ignored rather than raising, since a
    hand-edited env file is not worth crashing over.
    """
    values: dict[str, str] = {}

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue

        key, _, value = line.partition("=")
        key = key.strip()
        if not key:
            continue

        value = value.strip()
        # Strip one layer of matching quotes.
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]

        values[key] = value

    return values


def load_env_file(path: Path | None = None, *, override: bool = False) -> list[str]:
    """Load an env file into ``os.environ``.

    Args:
        path: Env file to read. Defaults to ``.env.local`` at the repo root.
        override: When False (the default), existing environment variables are
            left alone.

    Returns:
        The names of the variables actually set, so callers can log what was
        picked up without ever logging the values.
    """
    path = path or DEFAULT_ENV_FILE
    if not path.exists():
        return []

    applied: list[str] = []
    for key, value in parse_env_text(path.read_text(encoding="utf-8")).items():
        if override or not os.environ.get(key):
            os.environ[key] = value
            applied.append(key)

    return applied
