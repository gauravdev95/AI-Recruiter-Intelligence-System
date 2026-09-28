# Architecture

Phase 1 architecture. The guiding rule: **thin routers, real services, no
business domains yet**. Every layer below exists to serve Phases 2–20 without
being rewritten.

## Monorepo layout

```text
AI-Recruiter-Intelligence-System/
├── apps/
│   ├── backend/            # FastAPI + SQLAlchemy + Alembic
│   │   ├── src/
│   │   │   ├── main.py           # app factory: middleware, routers, /health
│   │   │   ├── config/           # pydantic-settings, one class per concern
│   │   │   ├── core/             # errors, request-id, security headers, logging
│   │   │   ├── db/               # engine, SessionLocal, Base, get_db
│   │   │   ├── shared/           # UUID pk / timestamp / soft-delete mixins
│   │   │   └── domains/
│   │   │       └── auth/         # the ONLY business domain in Phase 1
│   │   ├── alembic/              # migrations (append-only)
│   │   └── tests/                # pytest, real Postgres
│   └── frontend/           # React + Vite + TypeScript
│       └── src/
│           ├── app/              # router
│           ├── components/        # shared UI primitives
│           ├── features/          # landing, auth (one folder per area)
│           └── lib/              # apiClient, tokenStore, cookies, api, types
├── infra/docker/           # backend.Dockerfile, frontend.Dockerfile
├── docs/
├── scripts/
├── docker-compose.yml      # db + backend + frontend
└── Makefile
```

## Backend request lifecycle

```text
Request
  → RequestIdMiddleware      (X-Request-ID generate/forward, structlog binding) — outermost
  → SecurityHeadersMiddleware (nosniff, DENY, CSP, …)
  → CORSMiddleware            (origins from ALLOWED_ORIGINS, credentials on)
  → router → service → models (SQLAlchemy)
  → response
     ↑ any exception → core/error_handlers → {"error":{"code","message","details"}}
```

Middleware is registered so the request-id wrapper is outermost: **every**
response, including error responses, carries `X-Request-ID`, and every error
envelope includes it in `details`.

## Configuration

`src/config/config.py` holds one `pydantic-settings` class per concern
(`AppSettings`, `DatabaseSettings`, `SecuritySettings`), each with a cached
getter (`get_app_settings()`, …). Settings read from environment / `.env`.
Adding a new concern = adding a new class + getter, never editing a global dict.

## Database conventions

- UUID primary keys generated **application-side** (`uuid4`), no DB extension needed.
- `timestamptz` timestamps managed **application-side** (`TimestampMixin`), identical behaviour in tests and production.
- Native Postgres enums for controlled vocabularies (`user_role`).
- Every FK indexed; `refresh_tokens.user_id` cascades on user delete.
- Migrations are **append-only**: never edit an applied migration.

## Auth architecture

```text
POST /api/v1/auth/register|login
  → bcrypt-12 verify → issue_session()
  → access JWT (30 min, claims: sub/role/type=access) returned in body
  → opaque refresh token (sha256-hashed at rest) in httpOnly cookie + CSRF cookie

GET /api/v1/auth/me  →  Authorization: Bearer <access> → get_current_user

POST /api/v1/auth/refresh  →  httpOnly cookie + X-CSRF-Token header (double-submit)
  → ROTATES the refresh token (old one revoked) → new pair issued

POST /api/v1/auth/logout  →  revokes refresh token, clears cookies

require_role(CANDIDATE) / require_role(RECRUITER)  →  403 guard for future routes
```

No session state lives server-side beyond the `refresh_tokens` rows; access
tokens are stateless JWTs. Deactivating a user (`is_active=false`) immediately
invalidates both.

## Frontend architecture

- `lib/apiClient.ts` — single axios instance: `VITE_API_BASE_URL`, `withCredentials`,
  Bearer attach, CSRF header, 401 → one silent `/auth/refresh` retry.
- `lib/tokenStore.ts` — access token in memory only (never localStorage).
- `features/` — one self-contained folder per product area (Phase 1: `landing`, `auth`).
- Routing in `app/routes.tsx`; data fetching via TanStack Query.

## What comes later (not in Phase 1)

Future phases add domains under `src/domains/` (following the auth domain's
shape: `router.py` thin → `service.py` logic → `models.py` tables →
`schemas.py` contracts), features under `src/features/`, and tables via new
Alembic migrations. The foundation does not need to change for that.
