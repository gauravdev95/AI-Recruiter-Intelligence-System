# API

Base URL: `http://localhost:8000`. All Phase 1 endpoints live under `/api/v1`.
Interactive docs: `http://localhost:8000/docs`.

## Conventions

- **Versioning:** `/api/v1/...`. Breaking changes go to `/api/v2`.
- **Error envelope:** every error (domain, HTTP, validation, unexpected) renders as

  ```json
  { "error": { "code": "EMAIL_TAKEN", "message": "An account with this email already exists.", "details": { "request_id": "..." } } }
  ```

  `code` is stable and machine-readable; the frontend branches on it. Every
  response also carries an `X-Request-ID` header.
- **Auth:** access JWT in `Authorization: Bearer <token>` (30 min);
  refresh via httpOnly `refresh_token` cookie + `X-CSRF-Token` header
  (double-submit CSRF).

## Endpoints

### `GET /api/v1/health`

Liveness + database check. Used by the frontend landing page.

- `200` — `{"status": "ok", "database": "connected"}`
- `503` — `{"status": "error", "database": "disconnected"}`

### `POST /api/v1/auth/register` — `201`

```json
{ "email": "ada@example.com", "password": "s3cure-password", "role": "candidate", "full_name": "Ada" }
```

Creates the account **and** signs in: returns `AccessTokenResponse` and sets the
`refresh_token` (httpOnly) + `csrf_token` cookies. `role` is `candidate` or
`recruiter`. Errors: `409 EMAIL_TAKEN`, `422 VALIDATION_FAILED`.

### `POST /api/v1/auth/login` — `200`

```json
{ "email": "ada@example.com", "password": "s3cure-password", "remember_me": false }
```

Same response shape as register; `remember_me: true` issues a long-lived
refresh cookie, `false` a browser-session one. Errors: `401 INVALID_CREDENTIALS`.

### `POST /api/v1/auth/refresh` — `200`

Rotates the session: requires the `refresh_token` cookie **and** the
`X-CSRF-Token` header matching the `csrf_token` cookie. Returns a fresh
`AccessTokenResponse` and fresh cookies; the old refresh token is revoked.
Errors: `401 INVALID_REFRESH_TOKEN`, `403 CSRF_VALIDATION_FAILED`.

### `POST /api/v1/auth/logout` — `200`

Requires the same CSRF pair as refresh. Revokes the refresh token and clears
both cookies. Returns `{"message": "Logged out successfully."}`.

### `GET /api/v1/auth/me` — `200`

Requires `Authorization: Bearer <access_token>`. Returns the current user:

```json
{ "id": "…", "email": "ada@example.com", "full_name": "Ada", "role": "candidate", "is_active": true, "created_at": "…" }
```

Errors: `401 UNAUTHENTICATED`.

## Response shapes

```jsonc
// AccessTokenResponse
{ "access_token": "<jwt>", "token_type": "bearer", "expires_in": 1800,
  "user": { "id": "…", "email": "…", "full_name": "…", "role": "candidate", "is_active": true, "created_at": "…" } }
```

## What is NOT here (future phases)

No endpoints exist yet for profiles, jobs, verification, interviews, matching,
pipeline, messaging, or notifications. They will be added as new routers under
`/api/v1/` in their own phases.
