# Phase 1 — Project Foundation, Architecture & Core Infrastructure

> **Status:** Completed
> **Goal:** Create a production-quality technical foundation on which Phases 2–20 can later be implemented.

Phase 1 is an **infrastructure/foundation phase**, not a feature-development phase.
It establishes the monorepo, the backend and frontend skeletons, the database
with migrations, the authentication foundation, Docker-based local
infrastructure, tests, and documentation — and nothing more.

## What Phase 1 contains

| Area | Delivered |
|---|---|
| Monorepo | `apps/backend`, `apps/frontend`, `infra/docker`, `docs`, `scripts`, root `docker-compose.yml`, `Makefile`, `.env.example` |
| Backend | FastAPI, SQLAlchemy 2.x, Pydantic Settings, `/api/v1` versioning, `GET /api/v1/health` (with DB round-trip), structured error envelope, request-id middleware, security-headers middleware, structured logging, OpenAPI at `/docs` |
| Frontend | React + Vite + TypeScript + Tailwind + TanStack Query + react-router, `apiClient` (Bearer attach + silent refresh + CSRF), app shell, landing page with live backend/DB connectivity check, login/register pages, one minimal protected `/account` page |
| Database | PostgreSQL, UUID primary keys, `timestamptz`, app-managed timestamps, native enum for roles, Alembic with initial migration `0001_initial_auth_foundation` |
| Auth | `users` table (email unique, bcrypt-12 password hash, role `candidate`/`recruiter`, `is_active`), `refresh_tokens` table (hashed opaque tokens, rotation), register/login/refresh/logout/me endpoints, JWT access (30 min) + httpOnly refresh cookie, double-submit CSRF, `get_current_user` + `require_role` dependencies |
| Docker | `docker compose up --build` starts db + backend + frontend reproducibly |
| Tests | pytest (health + auth, against a real local Postgres with a hard local-host guard), `tsc`, `eslint`, `vite build` all green |
| Docs | `docs/PHASE_1.md`, `ARCHITECTURE.md`, `DEVELOPMENT_SETUP.md`, `DATABASE.md`, `API.md` |

## What Phase 1 intentionally does NOT contain

None of the following exist in this phase — not even as placeholders:

- Evidence / verification (GitHub, coding platforms, certificates), verification workers, VERIFIED/REJECTED logic
- Skills, automatic skill/technology extraction
- AI: no LLM integration, no embeddings, no RAG, no AI interviews, no semantic matching
- Matching: no cosine similarity, no rank fusion, no thresholds, no recommendations
- Recruiter features: no job creation, no pipeline/Kanban, no analytics
- Candidate features: no profile wizard, no matches feed, no Smart Apply
- Messaging, notifications, email workflows, WebSocket business features
- Celery workers / Redis job queues, production deployment

## Phase boundary rule

Before any future change, ask: *"Does this belong strictly to the phase being
implemented?"* If no, it does not go in. Phases 2–20 build on this foundation
without rewriting it.

## Acceptance criteria (all met)

- [x] Clean monorepo structure; backend/frontend/API-versioning established
- [x] FastAPI running; PostgreSQL connected; config system working; error handling + health endpoint working
- [x] React/Vite/TS/Tailwind working; apiClient working; frontend ↔ backend connectivity proven by the landing-page health check
- [x] PostgreSQL + SQLAlchemy + Alembic configured; initial migration applies cleanly
- [x] User identity, registration, login, refresh rotation, protected routes, `candidate`/`recruiter` roles
- [x] Docker Compose local environment reproducible via `docker compose up --build`
- [x] `pytest` PASS, `tsc` PASS, `eslint` PASS, frontend build PASS
- [x] Phase 1 / architecture / setup / database / API documented
