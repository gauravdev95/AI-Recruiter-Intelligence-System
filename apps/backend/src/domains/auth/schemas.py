"""Auth domain request/response schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.domains.auth.models import UserRole


class RegisterRequest(BaseModel):
    """Account registration payload."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    full_name: str | None = Field(default=None, max_length=200)


class LoginRequest(BaseModel):
    """Login payload."""

    email: EmailStr
    password: str = Field(min_length=1)
    remember_me: bool = False


class UserResponse(BaseModel):
    """Public user representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str | None
    role: UserRole
    is_active: bool
    created_at: datetime


class AccessTokenResponse(BaseModel):
    """Issued session: short-lived access token + user snapshot."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MessageResponse(BaseModel):
    """Simple message envelope."""

    message: str
