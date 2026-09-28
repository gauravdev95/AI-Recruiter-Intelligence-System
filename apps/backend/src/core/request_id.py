"""Per-request correlation ID propagated via a header and structlog context.

The middleware reuses an inbound ``X-Request-ID`` header when present,
otherwise generates one. The ID is echoed back on every response and is
merged into error-response ``details`` by the error handlers.
"""

from __future__ import annotations

import uuid
from contextvars import ContextVar
from typing import Callable

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-ID"

_request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


def get_request_id() -> str | None:
    """Return the request ID bound to the current request context, if any."""
    return _request_id_ctx.get()


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Bind a request ID for the request lifetime and echo it on the response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        token = _request_id_ctx.set(request_id)
        structlog.contextvars.bind_contextvars(request_id=request_id)
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.unbind_contextvars("request_id")
            _request_id_ctx.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
