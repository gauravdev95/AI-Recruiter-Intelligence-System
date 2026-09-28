"""Auth domain SQLAlchemy models."""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.database import Base
from src.shared.db_mixins import TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    """Account role; drives authorization via ``require_role``."""

    CANDIDATE = "candidate"
    RECRUITER = "recruiter"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Application user (candidate or recruiter)."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        # values_callable: persist the enum VALUES ("candidate"/"recruiter"),
        # matching the user_role type created by the initial migration.
        # SQLAlchemy's Enum defaults to persisting member NAMES ("CANDIDATE"),
        # which the DB type would reject.
        SAEnum(
            UserRole,
            name="user_role",
            native_enum=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server-side refresh-token session row.

    Only the SHA-256 hash of the opaque token is stored; the raw value is
    delivered to the client in an httpOnly cookie and never persisted.
    """

    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    remember_me: Mapped[bool] = mapped_column(Boolean, default=False)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
