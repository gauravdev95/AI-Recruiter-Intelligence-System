"""Application settings loaded from the environment via pydantic-settings.

Three focused settings groups (app, database, security) keep each consumer's
surface small. Each group is a singleton obtained through its cached getter.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """General application settings."""

    app_env: str = "development"
    secret_key: str
    frontend_base_url: str = "http://localhost:5173"
    allowed_origins: str = "http://localhost:5173"
    cookie_secure: bool = False
    # Single-service production deploy (e.g. Render free tier): the backend
    # also serves the built React SPA from <backend>/static so the whole app
    # runs same-origin (keeps the HttpOnly refresh cookie working).
    serve_frontend: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class DatabaseSettings(BaseSettings):
    """Database connection settings."""

    database_url: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class SecuritySettings(BaseSettings):
    """JWT / token security settings."""

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7
    cookie_secure: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_app_settings() -> AppSettings:
    """Return the cached application settings."""
    return AppSettings()


@lru_cache
def get_database_settings() -> DatabaseSettings:
    """Return the cached database settings."""
    return DatabaseSettings()


@lru_cache
def get_security_settings() -> SecuritySettings:
    """Return the cached security settings."""
    return SecuritySettings()
