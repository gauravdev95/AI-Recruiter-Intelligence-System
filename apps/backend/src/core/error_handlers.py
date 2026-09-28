"""Central exception handlers rendering the uniform error envelope.

Every error renders as::

    {"error": {"code": ..., "message": ..., "details": {...}}}

with the request ID merged into ``details``. Unexpected exceptions are
logged and rendered as ``INTERNAL_ERROR`` without leaking internals.
"""

from __future__ import annotations

import structlog
from fastapi import FastAPI, HTTPException as FastAPIHTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from src.core.exceptions import AppError
from src.core.request_id import get_request_id

logger = structlog.get_logger(__name__)

_HTTP_EXCEPTION_CODES = {
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
}


def _details_with_request_id(details: dict | None) -> dict:
    merged = dict(details or {})
    request_id = get_request_id()
    if request_id is not None:
        merged["request_id"] = request_id
    return merged


def _envelope(code: str, message: str, details: dict | None) -> dict:
    return {"error": {"code": code, "message": message, "details": _details_with_request_id(details)}}


async def _app_error_handler(request: Request, exc: AppError) -> JSONResponse:  # noqa: ARG001
    return JSONResponse(
        status_code=exc.status_code,
        content=_envelope(exc.code, exc.message, exc.details),
    )


async def _http_exception_handler(
    request: Request,  # noqa: ARG001
    exc: StarletteHTTPException,
) -> JSONResponse:
    code = _HTTP_EXCEPTION_CODES.get(exc.status_code, f"HTTP_{exc.status_code}")
    message = exc.detail if isinstance(exc.detail, str) else "An HTTP error occurred."
    return JSONResponse(status_code=exc.status_code, content=_envelope(code, message, None))


async def _validation_error_handler(
    request: Request,  # noqa: ARG001
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content=_envelope("VALIDATION_FAILED", "Request validation failed.", {"errors": exc.errors()}),
    )


async def _unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:  # noqa: ARG001
    logger.exception("Unhandled exception", request_id=get_request_id())
    return JSONResponse(
        status_code=500,
        content=_envelope("INTERNAL_ERROR", "An unexpected error occurred.", None),
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI app."""
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(FastAPIHTTPException, _http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(RequestValidationError, _validation_error_handler)
    app.add_exception_handler(Exception, _unhandled_error_handler)
