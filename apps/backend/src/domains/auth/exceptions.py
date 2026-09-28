"""Auth domain errors."""

from __future__ import annotations

from src.core.exceptions import AppError


class AuthError(AppError):
    """Base auth error (401 AUTH_ERROR) with overridable status/code."""

    status_code: int = 401
    code: str = "AUTH_ERROR"
    default_message: str = "Authentication failed."

    def __init__(self, message: str | None = None, details: dict | None = None) -> None:
        super().__init__(
            self.status_code,
            self.code,
            message if message is not None else self.default_message,
            details,
        )


class EmailAlreadyRegistered(AuthError):
    """Registration attempted with an email that already has an account."""

    status_code = 409
    code = "EMAIL_TAKEN"
    default_message = "An account with this email already exists."


class InvalidCredentials(AuthError):
    """Login failed: unknown email, wrong password, or inactive account."""

    code = "INVALID_CREDENTIALS"
    default_message = "Invalid email or password."


class InvalidRefreshToken(AuthError):
    """Refresh token missing, unknown, revoked, or expired."""

    code = "INVALID_REFRESH_TOKEN"
    default_message = "Invalid or expired refresh token."


class CsrfValidationFailed(AuthError):
    """CSRF cookie/header pair did not match."""

    status_code = 403
    code = "CSRF_VALIDATION_FAILED"
    default_message = "CSRF validation failed."
