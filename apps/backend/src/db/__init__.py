"""Database package.

Importing the domain models here registers their tables on ``Base.metadata``,
which is what Alembic's ``env.py`` reads for ``target_metadata``.
"""

from __future__ import annotations

from src.domains.auth import models  # noqa: F401
