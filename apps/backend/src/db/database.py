"""Database engine, session factory, declarative base, and helpers.

The engine is built lazily (on first use) from :class:`DatabaseSettings` so
that importing this module — e.g. to render migrations offline or to run
`--sql` — never requires a live database connection.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from src.config.config import get_database_settings


class Base(DeclarativeBase):
    """Declarative base for all domain models."""


def _build_engine() -> Engine:
    settings = get_database_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


_engine: Engine | None = None


def get_engine() -> Engine:
    """Return the application engine, building it on first use."""
    global _engine
    if _engine is None:
        _engine = _build_engine()
    return _engine


def __getattr__(name: str) -> object:
    # Allows `from src.db.database import engine` while keeping engine
    # construction lazy (no DATABASE_URL needed at import time).
    if name == "engine":
        return get_engine()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


SessionLocal = sessionmaker(autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a request-scoped session."""
    db = SessionLocal(bind=get_engine())
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> bool:
    """Return True when a ``SELECT 1`` succeeds; never raises."""
    try:
        with SessionLocal(bind=get_engine()) as db:
            db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


__all__ = ["Base", "SessionLocal", "check_database_connection", "engine", "get_db", "get_engine"]
