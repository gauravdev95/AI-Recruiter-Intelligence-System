.PHONY: backend frontend migrate infra infra-down test

# FastAPI dev server.
backend:
	cd apps/backend && uvicorn src.main:app --reload --port 8000

# Vite dev server.
frontend:
	cd apps/frontend && npm run dev

# Apply Alembic migrations.
migrate:
	cd apps/backend && alembic upgrade head

# Postgres for local development.
infra:
	docker compose up -d

infra-down:
	docker compose down

# Backend test suite (requires TEST_DATABASE_URL pointing at a local Postgres).
test:
	cd apps/backend && pytest
