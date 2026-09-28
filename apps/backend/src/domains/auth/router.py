"""Auth HTTP API: register, login, refresh, logout, and current user.

Sessions use an httpOnly refresh-token cookie plus a readable CSRF cookie;
cookie-changing endpoints require the ``X-CSRF-Token`` header to match the
CSRF cookie (double-submit pattern).
"""

from __future__ import annotations

import hmac
import secrets
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from src.config.config import get_app_settings
from src.db.database import get_db
from src.domains.auth import service
from src.domains.auth.dependencies import get_current_user
from src.domains.auth.exceptions import CsrfValidationFailed, InvalidRefreshToken
from src.domains.auth.models import User
from src.domains.auth.schemas import (
    AccessTokenResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"
CSRF_COOKIE_NAME = "csrf_token"
CSRF_HEADER_NAME = "X-CSRF-Token"
COOKIE_PATH = "/api/v1/auth"


def _client_info(request: Request) -> tuple[str | None, str | None]:
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return user_agent, ip_address


def _set_session_cookies(
    response: Response,
    *,
    refresh_token: str,
    remember_me: bool,
    expires_at: datetime,
) -> None:
    settings = get_app_settings()
    max_age = int((expires_at - datetime.now(timezone.utc)).total_seconds()) if remember_me else None
    response.set_cookie(
        REFRESH_COOKIE_NAME,
        refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=COOKIE_PATH,
        max_age=max_age,
    )
    response.set_cookie(
        CSRF_COOKIE_NAME,
        secrets.token_urlsafe(32),
        httponly=False,
        secure=settings.cookie_secure,
        samesite="lax",
        path=COOKIE_PATH,
        max_age=max_age,
    )


def _clear_session_cookies(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE_NAME, path=COOKIE_PATH)
    response.delete_cookie(CSRF_COOKIE_NAME, path=COOKIE_PATH)


def _verify_csrf(request: Request) -> None:
    cookie_value = request.cookies.get(CSRF_COOKIE_NAME)
    header_value = request.headers.get(CSRF_HEADER_NAME)
    if not cookie_value or not header_value:
        raise CsrfValidationFailed()
    if not hmac.compare_digest(cookie_value, header_value):
        raise CsrfValidationFailed()


def _to_access_token_response(user: User, session: dict) -> AccessTokenResponse:
    return AccessTokenResponse(
        access_token=session["access_token"],
        token_type="bearer",
        expires_in=session["expires_in"],
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=AccessTokenResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AccessTokenResponse:
    """Register a new account and start a session (cookies + access token)."""
    user = service.register_user(
        db,
        email=body.email,
        password=body.password,
        role=body.role,
        full_name=body.full_name,
    )
    user_agent, ip_address = _client_info(request)
    session = service.issue_session(
        db, user, remember_me=False, user_agent=user_agent, ip_address=ip_address
    )
    _set_session_cookies(
        response,
        refresh_token=session["raw_refresh_token"],
        remember_me=False,
        expires_at=session["refresh_expires_at"],
    )
    return _to_access_token_response(user, session)


@router.post("/login", response_model=AccessTokenResponse)
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AccessTokenResponse:
    """Authenticate and start a session (cookies + access token)."""
    user = service.authenticate(db, body.email, body.password)
    user_agent, ip_address = _client_info(request)
    session = service.issue_session(
        db,
        user,
        remember_me=body.remember_me,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    _set_session_cookies(
        response,
        refresh_token=session["raw_refresh_token"],
        remember_me=session["remember_me"],
        expires_at=session["refresh_expires_at"],
    )
    return _to_access_token_response(user, session)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AccessTokenResponse:
    """Rotate the refresh-token cookie and return a new access token."""
    _verify_csrf(request)
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_refresh:
        raise InvalidRefreshToken()
    user_agent, ip_address = _client_info(request)
    user, new_session = service.refresh_session(
        db, raw_refresh, user_agent=user_agent, ip_address=ip_address
    )
    _set_session_cookies(
        response,
        refresh_token=new_session["raw_refresh_token"],
        remember_me=new_session["remember_me"],
        expires_at=new_session["refresh_expires_at"],
    )
    return _to_access_token_response(user, new_session)


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    """Revoke the refresh-token session and clear cookies."""
    _verify_csrf(request)
    raw_refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    service.revoke_refresh_token(db, raw_refresh)
    _clear_session_cookies(response)
    return MessageResponse(message="Logged out successfully.")


@router.get("/me", response_model=UserResponse)
def me(user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    """Return the currently authenticated user."""
    return UserResponse.model_validate(user)
