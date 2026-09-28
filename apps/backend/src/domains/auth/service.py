"""Auth domain service: registration, authentication, and session lifecycle."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from src.config.config import get_security_settings
from src.domains.auth.exceptions import (
    EmailAlreadyRegistered,
    InvalidCredentials,
    InvalidRefreshToken,
)
from src.domains.auth.models import RefreshToken, User, UserRole
from src.domains.auth.security import (
    create_access_token,
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    verify_password,
)

# Non-"remember me" sessions live for a single day.
_DEFAULT_REFRESH_TOKEN_DAYS = 1


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def register_user(
    db: Session,
    *,
    email: str,
    password: str,
    role: UserRole,
    full_name: str | None,
) -> User:
    """Create a new user; raises :class:`EmailAlreadyRegistered` on duplicates."""
    normalized_email = email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing is not None:
        raise EmailAlreadyRegistered()

    user = User(
        email=normalized_email,
        password_hash=hash_password(password),
        role=role,
        full_name=full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    """Return the user for valid credentials; raise :class:`InvalidCredentials`."""
    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    if not user.is_active:
        raise InvalidCredentials()
    return user


def _build_session_dict(user: User, raw_refresh_token: str, refresh_expires_at: datetime, remember_me: bool) -> dict:
    settings = get_security_settings()
    return {
        "raw_refresh_token": raw_refresh_token,
        "access_token": create_access_token(user_id=user.id, role=user.role),
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
        "refresh_expires_at": refresh_expires_at,
        "remember_me": remember_me,
    }


def issue_session(
    db: Session,
    user: User,
    *,
    remember_me: bool,
    user_agent: str | None,
    ip_address: str | None,
) -> dict:
    """Create a refresh-token session row and a fresh access token."""
    settings = get_security_settings()
    days = settings.jwt_refresh_token_expire_days if remember_me else _DEFAULT_REFRESH_TOKEN_DAYS
    expires_at = _utcnow() + timedelta(days=days)

    raw_refresh_token = generate_opaque_token()
    row = RefreshToken(
        user_id=user.id,
        token_hash=hash_opaque_token(raw_refresh_token),
        expires_at=expires_at,
        remember_me=remember_me,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _build_session_dict(user, raw_refresh_token, expires_at, remember_me)


def refresh_session(
    db: Session,
    raw_refresh: str | None,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> tuple[User, dict]:
    """Rotate a refresh token: revoke the old row, issue a new session."""
    if not raw_refresh:
        raise InvalidRefreshToken()

    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_opaque_token(raw_refresh)).first()
    if row is None or row.revoked_at is not None or row.expires_at <= _utcnow():
        raise InvalidRefreshToken()

    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise InvalidRefreshToken()

    # Rotate: the presented token is single-use from here on.
    row.revoked_at = _utcnow()
    new_session = issue_session(
        db,
        user,
        remember_me=row.remember_me,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    return user, new_session


def revoke_refresh_token(db: Session, raw_refresh: str | None) -> None:
    """Revoke a refresh token; idempotent (missing/already-revoked is a no-op)."""
    if not raw_refresh:
        return
    row = db.query(RefreshToken).filter(RefreshToken.token_hash == hash_opaque_token(raw_refresh)).first()
    if row is None or row.revoked_at is not None:
        return
    row.revoked_at = _utcnow()
    db.commit()
