"""Application entrypoint: builds and configures the FastAPI app."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config.config import get_app_settings
from src.core.error_handlers import register_error_handlers
from src.core.logging import configure_logging
from src.core.middleware import SecurityHeadersMiddleware
from src.core.request_id import RequestIdMiddleware
from src.db.database import check_database_connection
from src.domains.auth.router import router as auth_router

app_settings = get_app_settings()

configure_logging(debug=app_settings.app_env == "development")

app = FastAPI(title="AI Recruiter Intelligence System", version="0.1.0")

register_error_handlers(app)

allowed_origins = [origin.strip() for origin in app_settings.allowed_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware, hsts=app_settings.app_env == "production")
# Added last so it runs outermost: every request/response carries a request ID.
app.add_middleware(RequestIdMiddleware)

app.include_router(auth_router)


@app.get("/")
def root() -> dict:
    """Root liveness probe."""
    return {"message": "AI Recruiter Intelligence System backend is running"}


@app.get("/api/v1/health")
def health() -> JSONResponse:
    """Health check including database connectivity."""
    if check_database_connection():
        return JSONResponse(status_code=200, content={"status": "ok", "database": "connected"})
    return JSONResponse(status_code=503, content={"status": "error", "database": "disconnected"})
