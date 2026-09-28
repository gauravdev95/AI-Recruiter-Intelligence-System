"""Auth dependencies: current-user resolution and role gating."""

from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.db.database import get_db
from src.domains.auth.models import User, UserRole
from src.domains.auth.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def resolve_user_from_token(db: Session, token: str) -> User | None:
    """Return the active user for a bearer token, or None when invalid."""
    try:
        payload = decode_access_token(token)
        user = db.get(User, uuid.UUID(payload.get("sub", "")))
    except (jwt.PyJWTError, ValueError, AttributeError):
        return None
    if user is None or not user.is_active:
        return None
    return user


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Dependency resolving the request's authenticated user (401 otherwise)."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    user = resolve_user_from_token(db, credentials.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


def require_role(*roles: UserRole) -> Callable:
    """Dependency factory allowing only users with one of ``roles`` (403 otherwise)."""

    def _check_role(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions.")
        return user

    return _check_role
