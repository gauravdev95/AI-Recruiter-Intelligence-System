# AI Recruiter Intelligence System

> **Current Project Phase:** Phase 1 — Project Foundation, Architecture & Core Infrastructure
> **Status:** Completed

An AI-powered recruiter intelligence platform (final-year project), built in
phases. This repository currently contains the **Phase 1 foundation only**.

## What Phase 1 delivers

- **Monorepo** — `apps/backend` (FastAPI), `apps/frontend` (React + Vite + TypeScript), `infra/docker`, `docs`
- **Backend** — FastAPI + SQLAlchemy 2.x + Pydantic Settings, `/api/v1` versioning, `GET /api/v1/health` (with live DB check), structured error envelope `{"error":{"code","message","details"}}`, request-id + security-headers middleware, structured logging, OpenAPI at `/docs`
- **Frontend** — React + Vite + TS + Tailwind + TanStack Query + react-router, `apiClient` (Bearer attach, silent refresh, CSRF), landing page with live **Backend: Connected / Database: Healthy** check, login/register, minimal protected account page
- **Database** — PostgreSQL 16, UUID primary keys, `timestamptz`, native `user_role` enum, Alembic migration `0001_initial_auth_foundation` (`users`, `refresh_tokens`)
- **Auth foundation** — register / login / refresh (rotation) / logout / me, JWT access (30 min) + httpOnly refresh cookie, double-submit CSRF, `candidate` / `recruiter` roles, `get_current_user` + `require_role` guards
- **Docker** — `docker compose up --build` starts db + backend + frontend reproducibly
- **Tests** — `pytest` (13 tests, real Postgres), `tsc`, `eslint`, `vite build` all green

## Quick start

```bash
cp .env.example .env && cp apps/backend/.env.example apps/backend/.env
# set SECRET_KEY, JWT_SECRET_KEY, POSTGRES_PASSWORD
docker compose up --build
```

Frontend → http://localhost:5173 · API → http://localhost:8000 · Docs → http://localhost:8000/docs

See `docs/DEVELOPMENT_SETUP.md` for local (non-Docker) setup and `docs/PHASE_1.md` for the exact Phase 1 scope.

## Intentionally NOT implemented (future phases)

Verification / evidence, skills extraction, AI interviews, matching, recruiter
pipeline, candidate profiles, messaging, notifications, Celery workers, and
production deployment do **not** exist in this phase — not even as placeholders.
See `docs/PHASE_1.md` for the full boundary.
