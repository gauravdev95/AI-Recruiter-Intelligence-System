# Development Setup

## Prerequisites

- Python 3.12+
- Node 20+ / npm 10+
- Docker + Docker Compose (for the reproducible environment)
- PostgreSQL 16 (only needed if you run the backend/tests without Docker)

## Option A — Docker (recommended, reproducible)

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
# edit secrets (SECRET_KEY, JWT_SECRET_KEY, POSTGRES_PASSWORD)

docker compose up --build
```

Services:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API + OpenAPI docs | http://localhost:8000 · http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

The backend container runs `alembic upgrade head` on startup, so the schema is
always current.

Stop with `docker compose down` (add `-v` to drop the `pgdata` volume).

## Option B — Local (no Docker)

```bash
# 1. Database: start a local Postgres 16 and create the dev database.
createdb ai_recruiter

# 2. Backend
cd apps/backend
cp .env.example .env        # set DATABASE_URL, secrets
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd apps/frontend
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev                 # http://localhost:5173
```

## Running tests

Backend tests run against a **separate, disposable** Postgres database — never
the dev database. `tests/conftest.py` hard-fails if `TEST_DATABASE_URL` is
unset or resolves to a non-local host.

```bash
# start a local Postgres, then:
createdb ai_recruiter_test
cd apps/backend
TEST_DATABASE_URL=postgresql+psycopg://<user>:<pass>@localhost:5432/ai_recruiter_test pytest
```

Frontend checks:

```bash
cd apps/frontend
npm run lint        # eslint
npx tsc --noEmit    # typecheck (also runs as part of build)
npm run build       # production build
```

## Environment variables

Backend (`apps/backend/.env`): see `apps/backend/.env.example` — every
variable is documented there. The required ones are `DATABASE_URL`,
`SECRET_KEY`, and `JWT_SECRET_KEY`.

Frontend (`apps/frontend/.env`): `VITE_API_BASE_URL` (baked in at build time
by Vite — the Docker image takes it as a build arg).
