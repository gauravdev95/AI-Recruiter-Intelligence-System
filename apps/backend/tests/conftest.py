"""Shared pytest fixtures for backend integration tests.

**The test database guard runs before anything else in this file.** It reads
``TEST_DATABASE_URL`` from the environment and overwrites the application's
own ``DATABASE_URL`` with it *before* ``src.db.database`` (or anything that
imports it) is ever imported. ``src.db.database`` builds its engine lazily
from ``DATABASE_URL``, and ``alembic/env.py`` reads the same variable via
pydantic-settings — so this ordering is load-bearing: importing
``src.db.database`` even one line earlier would bind the engine to the
wrong database.

The hostname assertion is the second layer: a ``TEST_DATABASE_URL`` that
resolves to anything other than a known local test host hard-fails test
collection rather than silently running against a shared database.

Each test then runs inside an outer transaction on this test database
(rolled back at teardown, even though application code calls
``session.commit()`` internally — SQLAlchemy's
``join_transaction_mode="create_savepoint"`` translates inner commits into
savepoints instead of real commits).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

# This conftest runs from apps/backend; make sure `import src.*` resolves.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

_ALLOWED_TEST_HOSTS = {"localhost", "127.0.0.1", "::1"}


def _install_test_database_url() -> str:
    test_database_url = os.environ.get("TEST_DATABASE_URL")
    if not test_database_url:
        raise RuntimeError(
            "TEST_DATABASE_URL is not set. Tests must never fall back to the "
            "application's own DATABASE_URL (which may point at a shared or "
            "production database). Set TEST_DATABASE_URL to a disposable local "
            "Postgres — see apps/backend/.env.example."
        )

    hostname = (urlparse(test_database_url).hostname or "").lower()
    if hostname not in _ALLOWED_TEST_HOSTS:
        raise RuntimeError(
            f"TEST_DATABASE_URL host '{hostname}' is not a recognized local test host "
            f"({sorted(_ALLOWED_TEST_HOSTS)}). Refusing to run tests against it — if this "
            "is genuinely a disposable test host, add it to _ALLOWED_TEST_HOSTS "
            "explicitly, don't just make the check pass."
        )

    os.environ["DATABASE_URL"] = test_database_url
    return test_database_url


_TEST_DATABASE_URL = _install_test_database_url()

# Test-only secrets. setdefault() so a real environment still wins; the app
# itself requires these in production (fail-fast on missing secret).
os.environ.setdefault("SECRET_KEY", "phase1-test-secret-key-not-for-production")
os.environ.setdefault("JWT_SECRET_KEY", "phase1-test-jwt-secret-not-for-production")

# Everything below this line is safe to import: the engine is built from the
# now-overridden DATABASE_URL, which points at the test database.

from collections.abc import Generator  # noqa: E402

import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import src.db  # noqa: E402,F401 — registers models on Base.metadata
from src.db.database import get_db, get_engine  # noqa: E402
from src.main import app  # noqa: E402


def _run_migrations() -> None:
    cfg = Config()
    cfg.set_main_option(
        "script_location", str(Path(__file__).resolve().parents[1] / "alembic")
    )
    cfg.set_main_option("sqlalchemy.url", _TEST_DATABASE_URL)
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations() -> Generator[None, None, None]:
    _run_migrations()
    yield


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    connection = get_engine().connect()
    outer_transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
