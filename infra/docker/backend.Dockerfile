# Phase 1 — backend API image.
#
# Build context is the repository root:
#   docker build -f infra/docker/backend.Dockerfile .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# System deps kept minimal: psycopg[binary] needs no libpq at runtime,
# bcrypt ships wheels for cp312.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY apps/backend/requirements.txt ./
RUN pip install -r requirements.txt

COPY apps/backend/ ./

EXPOSE 8000

# Apply migrations, then serve. `alembic upgrade head` is idempotent.
CMD ["sh", "-c", "alembic upgrade head && uvicorn src.main:app --host 0.0.0.0 --port 8000"]
