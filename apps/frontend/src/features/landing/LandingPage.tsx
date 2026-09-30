import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Reveal from "../../components/Reveal";
import AuroraBackground from "../../components/AuroraBackground";
import { api } from "../../lib/api";
import type { HealthResponse } from "../../lib/types";

/* ------------------------------------------------------------------ */
/*  Animated background: aurora canvas + grid + vignette                */
/* ------------------------------------------------------------------ */
function Backdrop() {
  return (
    <>
      <AuroraBackground />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-grid mask-fade-radial absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05070f]" />
        <div className="absolute inset-0 shadow-[inset_0_0_220px_60px_rgba(3,5,12,0.85)]" />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny JSON syntax highlighter for the terminal card                  */
/* ------------------------------------------------------------------ */
function highlightJson(json: string) {
  return json.split(/("[^"]+"(?=:)|"[^"]+"|\b\d+\b|\btrue\b|\bfalse\b|\bnull\b)/g).map((part, i) => {
    if (/^"[^"]+"(?=:)$/.test(part))
      return (
        <span key={i} className="text-sky-300">
          {part}
        </span>
      );
    if (/^"/.test(part))
      return (
        <span key={i} className="text-emerald-300">
          {part}
        </span>
      );
    if (/^\d+$/.test(part))
      return (
        <span key={i} className="text-amber-300">
          {part}
        </span>
      );
    return <span key={i} className="text-slate-400">{part}</span>;
  });
}

/* ------------------------------------------------------------------ */
/*  Live status terminal — the demo centerpiece                        */
/* ------------------------------------------------------------------ */
function StatusTerminal() {
  const [latency, setLatency] = useState<number | null>(null);
  const healthQuery = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const t0 = performance.now();
      try {
        return await api.health();
      } finally {
        setLatency(Math.max(1, Math.round(performance.now() - t0)));
      }
    },
    retry: 1,
    refetchInterval: 10000,
  });

  const data = healthQuery.data;
  const backendOk = data?.status === "ok";
  const dbOk = data?.database === "connected";
  const allOk = backendOk && dbOk;

  return (
    <div className="terminal shadow-[0_30px_80px_-20px_rgba(59,130,246,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 font-mono text-xs text-slate-500">live — system status</span>
        <span className="ml-auto flex items-center gap-2">
          {allOk ? <span className="dot-live" /> : <span className="dot-down" />}
          <span className={`font-mono text-xs font-semibold ${allOk ? "text-emerald-300" : "text-red-300"}`}>
            {healthQuery.isPending ? "probing…" : allOk ? "ALL SYSTEMS GO" : "DEGRADED"}
          </span>
        </span>
      </div>
      <div className="space-y-1.5 p-5">
        <p>
          <span className="text-violet-300">$</span> <span className="text-slate-200">curl</span>{" "}
          <span className="text-slate-400">GET /api/v1/health</span>
          {latency !== null && !healthQuery.isPending && (
            <span className="ml-3 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
              {latency} ms
            </span>
          )}
        </p>
        {healthQuery.isPending && !data ? (
          <p className="terminal-cursor text-slate-500">awaiting response</p>
        ) : (
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {highlightJson(JSON.stringify(data ?? { status: "unreachable", database: "unknown" }, null, 2))}
          </pre>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-2 font-mono text-xs">
          <span className="flex items-center gap-2">
            {backendOk ? <span className="dot-live" /> : <span className="dot-down" />}
            <span className="text-slate-400">backend</span>
            <span className={backendOk ? "text-emerald-300" : "text-red-300"}>
              {healthQuery.isPending ? "…" : backendOk ? "connected" : "disconnected"}
            </span>
          </span>
          <span className="flex items-center gap-2">
            {dbOk ? <span className="dot-live" /> : <span className="dot-down" />}
            <span className="text-slate-400">database</span>
            <span className={dbOk ? "text-emerald-300" : "text-red-300"}>
              {healthQuery.isPending ? "…" : dbOk ? "healthy" : "unhealthy"}
            </span>
          </span>
          <span className="ml-auto text-slate-600">auto-refresh · 10s</span>
        </div>
        {healthQuery.isError && (
          <p className="pt-1 text-xs text-slate-500">
            Could not reach the API at the configured <span className="font-mono">VITE_API_BASE_URL</span>.
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tech stack cards                                                   */
/* ------------------------------------------------------------------ */
const STACK = [
  {
    name: "FastAPI",
    desc: "Async Python API · /api/v1 versioning · OpenAPI docs",
    accent: "from-emerald-400 to-teal-500",
    icon: (
      <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" strokeLinejoin="round" />
    ),
  },
  {
    name: "PostgreSQL + Alembic",
    desc: "UUID keys · timestamptz · native enums · migrations",
    accent: "from-sky-400 to-blue-600",
    icon: (
      <>
        <ellipse cx="12" cy="5.5" rx="8" ry="3" />
        <path d="M4 5.5V12c0 1.66 3.58 3 8 3s8-1.34 8-3V5.5" />
        <path d="M4 12v6.5c0 1.66 3.58 3 8 3s8-1.34 8-3V12" />
      </>
    ),
  },
  {
    name: "React + Vite + TS",
    desc: "Type-safe SPA · TanStack Query · Tailwind CSS",
    accent: "from-cyan-300 to-sky-500",
    icon: (
      <>
        <circle cx="12" cy="12" r="2" />
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
      </>
    ),
  },
  {
    name: "JWT Auth",
    desc: "bcrypt-12 · access tokens · HttpOnly refresh cookies · CSRF",
    accent: "from-amber-300 to-orange-500",
    icon: (
      <>
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    name: "Docker Compose",
    desc: "db · api · web — one command reproducible env",
    accent: "from-blue-400 to-indigo-500",
    icon: (
      <>
        <path d="M4 8h6v6H4zM10 8h6v6h-6zM4 14h6v3H4zM10 14h6v3h-6zM16 8h4v9h-4z" strokeLinejoin="round" />
      </>
    ),
  },
  {
    name: "Pytest",
    desc: "13 integration tests · real Postgres · rolled back",
    accent: "from-violet-400 to-purple-600",
    icon: (
      <>
        <path d="M9 11.5 11 14l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  API endpoints table                                                */
/* ------------------------------------------------------------------ */
const ENDPOINTS = [
  { method: "GET", path: "/api/v1/health", desc: "Service + database liveness probe", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { method: "POST", path: "/api/v1/auth/register", desc: "Create account — candidate or recruiter", tone: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  { method: "POST", path: "/api/v1/auth/login", desc: "Authenticate — mint JWT + session cookies", tone: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  { method: "POST", path: "/api/v1/auth/refresh", desc: "Rotate refresh token (CSRF-guarded)", tone: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
  { method: "GET", path: "/api/v1/auth/me", desc: "Current user — protected route", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { method: "POST", path: "/api/v1/auth/logout", desc: "End session — clear cookies server-side", tone: "text-sky-300 bg-sky-400/10 border-sky-400/20" },
];

/* ------------------------------------------------------------------ */
/*  Auth flow steps                                                    */
/* ------------------------------------------------------------------ */
const FLOW = [
  { n: "01", title: "Register", desc: "Email + password + role. bcrypt-12 hashes the password; a UUID user row is created." },
  { n: "02", title: "Login", desc: "Credentials verified against the hash. A 30-minute JWT access token is minted." },
  { n: "03", title: "Session", desc: "HttpOnly refresh cookie (7 days) + CSRF double-submit token are set. No token in JS-reachable storage." },
  { n: "04", title: "Protected", desc: "Every request carries Bearer or cookie credentials; /me and future routes enforce auth server-side." },
];

const STATS = [
  { value: "13", label: "backend tests passing" },
  { value: "6", label: "versioned API endpoints" },
  { value: "1", label: "Alembic migration" },
  { value: "100%", label: "TypeScript strict" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Backdrop />
      <Navbar />

      {/* ================= HERO ================= */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-36">
        <section className="flex flex-col items-center text-center">
          <div className="hero-in" style={{ "--hero-delay": "0ms" } as React.CSSProperties}>
            <span className="section-kicker">
              <span className="dot-live" />
              Phase 1 · Foundation complete
            </span>
          </div>
          <h1
            className="hero-in mt-7 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ "--hero-delay": "120ms" } as React.CSSProperties}
          >
            AI Recruiter
            <br />
            <span className="gradient-text animate-gradient-pan">Intelligence System</span>
          </h1>
          <p
            className="hero-in mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
            style={{ "--hero-delay": "240ms" } as React.CSSProperties}
          >
            An AI-powered hiring platform where every candidate skill is backed by verifiable
            evidence. Phase 1 lays the production-grade foundation — API, database, auth and
            infrastructure — on which everything else will be built.
          </p>
          <div
            className="hero-in mt-9 flex flex-wrap items-center justify-center gap-4"
            style={{ "--hero-delay": "360ms" } as React.CSSProperties}
          >
            <a href="#status" className="btn-primary-glow">
              <span className="dot-live" />
              See live status
            </a>
            <Link to="/register" className="btn-ghost">
              Try the auth flow
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="glass px-4 py-5 text-center">
                <p className="gradient-text text-3xl font-black">{s.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ================= LIVE STATUS ================= */}
        <section id="status" className="mx-auto mt-24 max-w-4xl scroll-mt-28">
          <Reveal>
            <div className="mb-8 text-center">
              <span className="section-kicker">Live proof</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                The backend is <span className="gradient-text">talking</span> right now
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">
                This terminal hits the real <span className="font-mono text-slate-300">/api/v1/health</span>{" "}
                endpoint — FastAPI → PostgreSQL round-trip — and refreshes every 10 seconds.
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <StatusTerminal />
          </Reveal>
        </section>

        {/* ================= TECH STACK ================= */}
        <section id="stack" className="mx-auto mt-28 max-w-6xl scroll-mt-28">
          <Reveal>
            <div className="mb-10 text-center">
              <span className="section-kicker">Under the hood</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Production-grade <span className="gradient-text">stack</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 110}>
                <div className="card-dark card-hover group h-full">
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.accent} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                      {t.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= ENDPOINTS ================= */}
        <section id="endpoints" className="mx-auto mt-28 max-w-4xl scroll-mt-28">
          <Reveal>
            <div className="mb-8 text-center">
              <span className="section-kicker">API surface</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Six endpoints. <span className="gradient-text">Zero placeholders.</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">
                Every route below is implemented, tested and documented in OpenAPI at{" "}
                <span className="font-mono text-slate-300">/docs</span>.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="glass divide-y divide-white/[0.07] overflow-hidden">
              {ENDPOINTS.map((e) => (
                <div
                  key={e.path}
                  className="group flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-5"
                >
                  <span className={`method-badge border ${e.tone}`}>{e.method}</span>
                  <code className="font-mono text-sm text-slate-200 transition-colors group-hover:text-white">
                    {e.path}
                  </code>
                  <span className="text-sm text-slate-500 sm:ml-auto sm:text-right">{e.desc}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ================= AUTH FLOW ================= */}
        <section id="auth-flow" className="mx-auto mt-28 max-w-6xl scroll-mt-28">
          <Reveal>
            <div className="mb-10 text-center">
              <span className="section-kicker">Security</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Auth that <span className="gradient-text">actually works</span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-400">
                Register a real account above and watch the full session lifecycle —
                tokens, cookies and protected routes.
              </p>
            </div>
          </Reveal>
          <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden="true"
              className="flow-line absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent lg:block"
            />
            {FLOW.map((f, i) => (
              <Reveal key={f.n} delay={i * 130}>
                <div className="card-dark card-hover relative h-full">
                  <span className="gradient-text font-mono text-sm font-bold">{f.n}</span>
                  <h3 className="mt-2 text-lg font-bold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= SCOPE ================= */}
        <section className="mx-auto mt-28 max-w-4xl">
          <Reveal>
            <div className="glass px-8 py-8 text-center">
              <h2 className="text-xl font-bold text-white">Deliberately out of scope</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                Verification, AI interviews, matching, recruiter pipeline, messaging — these belong
                to future phases and are <span className="text-slate-200">intentionally not implemented</span>{" "}
                yet. Phase 1 is the foundation everything else will stand on.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["Verification", "AI interviews", "Matching", "Kanban pipeline", "Messaging", "Analytics"].map(
                  (x) => (
                    <span
                      key={x}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-500 line-through decoration-slate-600"
                    >
                      {x}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="mt-24 border-t border-white/[0.07] py-8 text-center">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-300">AI Recruiter Intelligence System</span> — Phase 1 ·
          Foundation, architecture &amp; core infrastructure
        </p>
        <p className="mt-1 font-mono text-xs text-slate-600">gauravdev95 · final-year project</p>
      </footer>
    </div>
  );
}
