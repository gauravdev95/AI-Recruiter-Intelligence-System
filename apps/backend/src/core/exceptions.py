"""Application error hierarchy.

Every domain error subclasses :class:`AppError`, which carries an HTTP
status code, a stable machine-readable ``code``, a human message, and an
optional ``details`` dict. Error handlers render all of them through the
same ``{"error": {...}}`` envelope.
"""

from __future__ import annotations


class AppError(Exception):
    """Base class for all expected application errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: dict | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or {}


class NotFound(AppError):
    """Resource not found (404)."""

    def __init__(self, message: str = "Resource not found.", details: dict | None = None) -> None:
        super().__init__(404, "NOT_FOUND", message, details)


class Forbidden(AppError):
    """Action not permitted (403)."""

    def __init__(self, message: str = "Forbidden.", details: dict | None = None) -> None:
        super().__init__(403, "FORBIDDEN", message, details)


class Conflict(AppError):
    """State conflict, e.g. a duplicate resource (409)."""

    def __init__(self, message: str = "Conflict.", details: dict | None = None) -> None:
        super().__init__(409, "CONFLICT", message, details)


class ValidationFailed(AppError):
    """Input validation failed (422)."""

    def __init__(self, message: str = "Validation failed.", details: dict | None = None) -> None:
        super().__init__(422, "VALIDATION_FAILED", message, details)
