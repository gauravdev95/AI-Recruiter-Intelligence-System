# Database

PostgreSQL 16. Phase 1 contains only the tables required for the
authentication foundation.

## Conventions (apply to every table)

- **Primary key:** `id UUID`, generated application-side (`uuid4`) via
  `UUIDPrimaryKeyMixin` — no DB extension required, ids available before INSERT.
- **Timestamps:** `created_at` / `updated_at`, `timestamptz`, application-side
  defaults via `TimestampMixin` — identical behaviour in tests and production.
- **Enums:** Postgres native enums (`user_role`).
- **Naming:** tables `snake_case` plural; FK columns `<singular>_id`; every FK indexed.
- **Migrations:** Alembic, append-only — never edit an applied migration.

## Tables

### `users`

The single authentication identity for every role. Role-specific data will
live in separate profile tables in later phases — never in a second auth table.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | app-generated |
| `email` | varchar(320) unique, indexed | stored lowercase |
| `password_hash` | varchar(255), nullable | bcrypt; NULL reserved for future OAuth-only accounts |
| `role` | `user_role` enum | `candidate` \| `recruiter` |
| `full_name` | varchar(200), nullable | |
| `is_active` | boolean, default true | deactivating invalidates all sessions immediately |
| `created_at` / `updated_at` | timestamptz | |

### `refresh_tokens`

Server-side session records. Only the **sha256 hash** of the opaque token is
stored — a leaked row cannot be replayed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users.id` ON DELETE CASCADE, indexed | |
| `token_hash` | varchar(64) unique | sha256 hex of the opaque token |
| `expires_at` | timestamptz | |
| `revoked_at` | timestamptz, nullable | set on rotation / logout |
| `remember_me` | boolean, default false | |
| `user_agent` / `ip_address` | varchar, nullable | audit trail |
| `created_at` / `updated_at` | timestamptz | |

## Migrations

- `alembic/versions/0001_initial_auth_foundation.py` — creates the `user_role`
  enum, `users`, and `refresh_tokens`.
- Apply: `cd apps/backend && alembic upgrade head`
- New migration: `alembic revision --autogenerate -m "<what>"` (models must be
  imported in `src/db/__init__.py` for autogenerate to see them), then review
  the generated file by hand before applying.
