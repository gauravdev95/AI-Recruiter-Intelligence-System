# Deployment — free hosting (Render + Neon)

Phase 1 is deployable **for free** as a single service. This guide gets you a
live, working URL in about 15 minutes.

## Architecture

```
                  ┌─────────────────────────────────┐
  browser ──────▶ │  Render free web service        │ ──▶ Neon Postgres (free)
                  │  FastAPI :8000                  │
                  │   ├─ /api/v1/*   (JSON API)     │
                  │   └─ /*          (React SPA)    │
                  └─────────────────────────────────┘
```

One service serves **both** the API and the built React SPA from the same
origin. This is deliberate: the auth refresh cookie uses `SameSite=Lax`, so
splitting frontend and backend onto two different domains would break silent
token refresh. Same-origin keeps login → refresh → logout working exactly as
tested locally.

- **Render** (free tier): web service, 750 hrs/month. Spins down after
  ~15 min idle — first request after idle takes ~30–60 s (cold start).
- **Neon** (free tier): serverless Postgres, no expiry, 0.5 GB storage —
  plenty for Phase 1 auth tables.

## Prerequisites

1. A [Render](https://dashboard.render.com) account (the repo owner's GitHub
   — `gauravdev95` — should be connected to it).
2. A [Neon](https://console.neon.tech) account (free).

## Step 1 — Create the Neon database (5 min)

1. <https://console.neon.tech> → **New Project** → name `ai-recruiter-phase1`,
   region closest to you (e.g. Singapore), Postgres 16 → **Create**.
2. On the dashboard, copy the **connection string** (it looks like
   `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require`).
   Keep it handy — it goes into `DATABASE_URL`.

## Step 2 — Deploy the Blueprint on Render (5 min)

1. <https://dashboard.render.com> → **New +** → **Blueprint** →
   select repo `gauravdev95/AI-Recruiter-Intelligence-System` → **Connect**.
   Render reads `render.yaml` and shows one web service: `ai-recruiter-phase1`.
2. Render prompts for the `sync: false` values — fill them in:
   - `DATABASE_URL` → the Neon connection string from Step 1.
   - `ALLOWED_ORIGINS` → `https://ai-recruiter-phase1.onrender.com`
     (use the actual service URL Render assigns).
   - `FRONTEND_BASE_URL` → same URL as above.
   (`SECRET_KEY` / `JWT_SECRET_KEY` are auto-generated; `COOKIE_SECURE=true`
   and `SERVE_FRONTEND=true` are already set in `render.yaml`.)
3. **Apply** → Render builds (pip install → `npm ci` → `npm run build` →
   SPA copied into the backend → `alembic upgrade head` as the final build
   step), then starts uvicorn.

## Step 3 — Verify (2 min)

Open the service URL and check:

| Check | Expected |
|---|---|
| `GET /` | Landing page renders |
| `GET /api/v1/health` | `{"status":"ok","database":"connected"}` |
| Register a new account in the UI | Lands on `/account`, name/email shown |
| Refresh the `/account` page | Still logged in (silent refresh via cookie) |
| `GET /docs` | Interactive API docs |

If `/api/v1/health` returns `disconnected`, the `DATABASE_URL` is wrong —
check the Neon string (it must include `?sslmode=require`).

## How the single-service build works

`render.yaml`'s `buildCommand`:

```bash
pip install -r apps/backend/requirements.txt
cd apps/frontend && npm ci && npm run build
rm -rf ../backend/static && mkdir -p ../backend/static
cp -r dist/. ../backend/static/
```

At startup, `SERVE_FRONTEND=true` makes `apps/backend/src/main.py` serve
`apps/backend/static/`:

- `/`, `/register`, `/login`, `/account` → `index.html` (SPA fallback)
- `/assets/*` → hashed JS/CSS files
- `/api/*`, `/docs`, `/openapi.json` → **never** shadowed; unknown `/api/*`
  paths return the structured `{"error":{"code":"NOT_FOUND",...}}` JSON

Local dev is unchanged: `SERVE_FRONTEND` defaults to `false`, so
`npm run dev` + uvicorn work exactly as in `DEVELOPMENT_SETUP.md`.

## Free-tier caveats (honest)

- **Cold starts:** after ~15 min idle the service sleeps; the next visit
  takes ~30–60 s to wake. Normal for Render free.
- **No Render Postgres used:** Render's free Postgres expires after 90 days,
  which is why the database lives on Neon (no expiry).
- **Logs:** Render keeps limited log history on free tier — use `/api/v1/health`
  as the first diagnostic.

## Redeploying

Every push to `main` auto-redeploys (Render default). Migrations run
automatically as the last step of the build before the new version starts.
