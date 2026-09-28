"""Password hashing and token primitives for the auth domain.

- Passwords: bcrypt with 12 rounds.
- Access tokens: signed JWTs (``type="access"`` claim).
- Refresh tokens: opaque random values; only their SHA-256 hash is stored.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from src.config.config import get_security_settings
from src.domains.auth.models import UserRole


def hash_password(password: str) -> str:
    """Hash a password with bcrypt (12 rounds)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str | None) -> bool:
    """Return True when ``password`` matches ``password_hash``; False otherwise."""
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(*, user_id: uuid.UUID, role: UserRole | str) -> str:
    """Create a short-lived signed access JWT for ``user_id``."""
    settings = get_security_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role.value if isinstance(role, UserRole) else str(role),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate an access JWT; raises :class:`jwt.InvalidTokenError`.

    Raises :class:`jwt.InvalidTokenError` when the ``type`` claim is not
    ``"access"`` (e.g. a token of another kind is presented).
    """
    settings = get_security_settings()
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Token is not an access token.")
    return payload


def generate_opaque_token() -> str:
    """Generate a cryptographically random opaque refresh token."""
    return secrets.token_urlsafe(32)


def hash_opaque_token(raw_token: str) -> str:
    """SHA-256 hex digest of an opaque token (what is stored server-side)."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
