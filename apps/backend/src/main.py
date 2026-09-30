"""Application entrypoint: builds and configures the FastAPI app."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

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
# Render injects RENDER_EXTERNAL_URL at runtime (https://<service>.onrender.com).
# Same-origin deploys need no CORS entry, but keep it listed for correctness.
_render_url = os.environ.get("RENDER_EXTERNAL_URL")
if _render_url and _render_url not in allowed_origins:
    allowed_origins.append(_render_url)
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


@app.get("/api/v1/health")
def health() -> JSONResponse:
    """Health check including database connectivity."""
    if check_database_connection():
        return JSONResponse(status_code=200, content={"status": "ok", "database": "connected"})
    return JSONResponse(status_code=503, content={"status": "error", "database": "disconnected"})


# --- Single-service frontend serving (production) ---------------------------
# When SERVE_FRONTEND=true and apps/backend/static/index.html exists (placed
# there by the deploy build step), the API also serves the React SPA so the
# whole app runs same-origin on one host/port.
# NOTE: this catch-all is registered LAST so API, docs and OpenAPI routes
# always match first and are never shadowed by the SPA fallback.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "static"
SERVE_SPA = (
    app_settings.serve_frontend and (FRONTEND_DIR / "index.html").is_file()
)

if SERVE_SPA:

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        """Serve built frontend assets, falling back to index.html for SPA routes."""
        if full_path.startswith("api/"):
            # Unknown API route: structured 404, never the SPA.
            return JSONResponse(
                status_code=404,
                content={"error": {"code": "NOT_FOUND", "message": "Not found"}},
            )
        candidate = (FRONTEND_DIR / full_path).resolve()
        if (
            full_path
            and candidate.is_file()
            and FRONTEND_DIR.resolve() in candidate.parents
        ):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIR / "index.html")

else:

    @app.get("/")
    def root() -> dict:
        """Root liveness probe."""
        return {"message": "AI Recruiter Intelligence System backend is running"}
