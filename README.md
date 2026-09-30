# AI Recruiter Intelligence System

> **Current phase:** Phase 1 — Project Foundation, Architecture & Core Infrastructure
> **Status:** ✅ Completed (2026-09-29)

A final-year B.Tech project: an AI-verified talent marketplace that connects
recruiters with candidates. This repository is built **phase by phase** —
Phase 1 is the production-quality technical foundation on which all future
phases will be built. It contains the monorepo, a working FastAPI backend, a
React frontend, PostgreSQL with migrations, a complete JWT authentication
system, Docker Compose infrastructure, tests, and documentation.

## 🎬 Live demo

Everything below was captured from a **real running system** — no mocks, no
staged UI. Full gallery (7 screenshots + reproduction scripts) in
[`docs/demo/README.md`](docs/demo/README.md).

**Landing page tour (20 s)** — animated showcase page with a live
FastAPI → PostgreSQL health terminal:

<video src="docs/demo/videos/demo-landing-tour.mp4" controls width="100%"></video>

**Real registration → protected account (20 s)** — a genuinely new account
is typed in and created against the live API, then the protected
`/account` page loads the user via `GET /api/v1/auth/me`:

<video src="docs/demo/videos/demo-auth-flow.mp4" controls width="100%"></video>

## ✨ What Phase 1 includes

**Backend** (`apps/backend/` — FastAPI + SQLAlchemy 2.x + Pydantic)

- Versioned API under `/api/v1`, interactive OpenAPI docs at `/docs`
- `GET /api/v1/health` with a real database round-trip
- Complete auth: register, login, refresh-token rotation, logout,
  `GET /auth/me` — JWT access tokens (30 min) + HttpOnly refresh cookies
  with double-submit CSRF protection
- Security: bcrypt-12 password hashing, `candidate` / `recruiter` roles,
  `get_current_user` / `require_role` guards
- Structured error envelope (`{error: {code, message, details}}`),
  request-id middleware, security-headers middleware, structured logging

**Frontend** (`apps/frontend/` — React + Vite + TypeScript + Tailwind)

- Dark, animated Phase 1 showcase landing page: aurora/grid background,
  glassmorphism, scroll-reveal animations, and a **live backend health
  terminal** (polls the API every 10 s, shows measured latency)
- Auth pages with matching design: register (role selector), login,
  protected account page, 404 — loading states, validation errors
- `apiClient` with Bearer <redacted> injection, silent token refresh and CSRF handling

**Database** (PostgreSQL + Alembic)

- Migration `0001_initial_auth`: `user_role` enum, `users` table (UUID PK,
  unique email, `is_active`, `timestamptz`), `refresh_tokens` table
  (hashed opaque tokens, expiry, revocation)

**Infrastructure**

- `docker compose up --build` starts PostgreSQL + backend + frontend
  reproducibly (see `docker-compose.yml`)

## 🛠 Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.x, Pydantic Settings, Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT (access) + HttpOnly refresh cookies, bcrypt-12, double-submit CSRF |
| Frontend | React 18, Vite, TypeScript (strict), Tailwind CSS, TanStack Query, React Router |
| Infra | Docker Compose (db / backend / frontend) |
| Tests | pytest (backend, real PostgreSQL), tsc, ESLint, Vite build |

## 📁 Project structure

```
.
├── apps/
│   ├── backend/        # FastAPI app (src/, alembic/, tests/)
│   └── frontend/       # React + Vite + TS SPA
├── docker-compose.yml  # db + backend + frontend
├── infra/              # infrastructure extras
├── docs/
│   ├── PHASE_1.md      # Phase 1 scope, architecture, acceptance criteria
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEVELOPMENT_SETUP.md
│   └── demo/           # screenshots, 20 s videos, recording scripts
├── scripts/
├── Makefile            # backend / frontend / migrate / infra / test targets
└── .env.example        # copy to .env for docker compose
```

## 🚀 Quick start

**Option A — Docker (recommended)**

```bash
cp .env.example .env
docker compose up --build
# frontend → http://localhost:5173   api → http://localhost:8000/docs
```

**Option B — local development**

```bash
# backend
cd apps/backend
python -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # set DATABASE_URL, SECRET_KEY, JWT_SECRET_KEY
.venv/bin/alembic upgrade head
.venv/bin/uvicorn src.main:app --reload --port 8123

# frontend (new terminal)
cd apps/frontend
npm install
echo "VITE_API_BASE_URL=http://127.0.0.1:8123" > .env
npm run dev
```

## 🔌 API endpoints (Phase 1)

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/health` | — | Liveness + DB connectivity round-trip |
| POST | `/api/v1/auth/register` | — | Create account (email, password, role) → JWT pair |
| POST | `/api/v1/auth/login` | — | Login → JWT pair |
| POST | `/api/v1/auth/refresh` | refresh cookie | Rotate refresh token → new JWT pair |
| POST | `/api/v1/auth/logout` | access token | Revoke current refresh token |
| GET | `/api/v1/auth/me` | access token | Current user profile |

Full details: [`docs/API.md`](docs/API.md).

## ✅ Tests

```bash
cd apps/backend
TEST_DATABASE_URL=postgresql+psycopg://postgres@127.0.0.1:5432/phase1_test \
  .venv/bin/pytest -q          # 13 passed — registration, login, refresh
                               # rotation, protected-route guards, error shape
cd ../frontend
npx tsc --noEmit               # clean
npx eslint src --max-warnings=0 # clean
npm run build                  # green
```

Verified 2026-09-29: **13/13 backend tests pass** against a real PostgreSQL
database; frontend type-check, lint and production build all green; live API
checks (register → login → `/me` → refresh → logout, duplicate-email 409,
bad-token 401, structured 404) all pass with zero browser console errors.

## 📚 Documentation

| Doc | Covers |
|---|---|
| [`docs/PHASE_1.md`](docs/PHASE_1.md) | Phase objective, exact scope & exclusions, acceptance criteria |
| [`docs/demo/README.md`](docs/demo/README.md) | Screenshots, 20 s videos, how to re-record them |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture |
| [`docs/API.md`](docs/API.md) | API reference |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema & migrations |
| [`docs/DEVELOPMENT_SETUP.md`](docs/DEVELOPMENT_SETUP.md) | Local setup guide |

## ⛔ Deliberately out of scope (not Phase 1)

Phase 1 is a **foundation phase**, not a feature phase. None of the following
exist yet — not even as placeholders: evidence/verification pipelines,
AI interviews, LLM/RAG/matching, candidate setup wizard, recruiter job
dashboard, Smart Apply/Kanban, messaging/notifications. Each will be added in
its own future phase without rewriting this foundation.

## ⚠️ Note

`docker-compose.yml` is reviewed and YAML-validated; the demo and tests above
ran the same services as native processes, since no Docker daemon was
available in the build environment. Container-to-container runtime is the one
step not yet exercised end-to-end.
