import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Reveal from "../../components/Reveal";
import AiChip from "../../components/AiChip";
import WordReveal from "../../components/WordReveal";
import FloatingChips from "../../components/FloatingChips";
import DottedGlobe from "../../components/DottedGlobe";
import { api } from "../../lib/api";
import type { HealthResponse } from "../../lib/types";

/* ------------------------------------------------------------------ */
/*  Backdrop: deep black + orange radial glows + faint grid + vignette  */
/* ------------------------------------------------------------------ */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#05070f]">
      <div className="absolute left-1/2 top-[-20%] h-[70vh] w-[110vw] -translate-x-1/2 rounded-full bg-orange-600/[0.13] blur-[140px]" />
      <div className="absolute left-1/2 top-[30%] h-[50vh] w-[80vw] -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[120px]" />
      <div className="bg-grid mask-fade-radial absolute inset-0 opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#05070f]" />
      <div className="absolute inset-0 shadow-[inset_0_0_220px_60px_rgba(3,4,8,0.85)]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tiny JSON syntax highlighter for the terminal card                  */
/* ------------------------------------------------------------------ */
function highlightJson(json: string) {
  return json.split(/("[^"]+"(?=:)|"[^"]+"|\b\d+\b|\btrue\b|\bfalse\b|\bnull\b)/g).map((part, i) => {
    if (/^"[^"]+"(?=:)$/.test(part))
      return (
        <span key={i} className="text-orange-300">
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
    <div className="terminal shadow-[0_30px_80px_-20px_rgba(249,115,22,0.35)]">
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
      <div className="space-y-1.5 p-5 text-left">
        <p>
          <span className="text-orange-300">$</span> <span className="text-slate-200">curl</span>{" "}
          <span className="text-slate-400">GET /api/v1/health</span>
          {latency !== null && !healthQuery.isPending && (
            <span className="ml-3 rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-amber-300">
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
/*  Content — drawn from the GroundTruth AI project README              */
/* ------------------------------------------------------------------ */
const STATS = [
  { value: "13", label: "backend tests passing" },
  { value: "6", label: "versioned API endpoints" },
  { value: "1", label: "Alembic migration" },
  { value: "100%", label: "TypeScript strict" },
];

const HOW = [
  {
    n: "01",
    title: "Verify",
    headline: "Real checks, not self-reports.",
    desc: "Saving a GitHub username, coding-platform handle, repo URL or certificate fires a real third-party API check. Every claim settles to VERIFIED, REJECTED or FLAGGED — a claim never sits silently pending, and skills are never typed by hand.",
  },
  {
    n: "02",
    title: "Interview",
    headline: "Grounded in your actual code.",
    desc: "Once verification settles, a code-grounded AI interview is generated automatically — built from verified repositories and evidence, scored against a five-dimension rubric with a written rationale for every dimension.",
  },
  {
    n: "03",
    title: "Match",
    headline: "One score, both sides.",
    desc: "A relational pre-filter bounds the pool, then cosine similarity ranks inside it. The identical computed score is shown to the candidate and the recruiter — below threshold, a pair simply doesn't exist in either feed.",
  },
];

const BENTO = [
  {
    span: "md:col-span-2",
    title: "Evidence verification",
    desc: "Repository analysis, contribution share and authorship, technology detection from dependency manifests, coding-profile checks, certificate reachability. Every decision is stored with the raw evidence it was based on — “why this score” is always answerable.",
    icon: (
      <>
        <path d="M9 11.5 11 14l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      </>
    ),
  },
  {
    span: "",
    title: "AI interview",
    desc: "Repository-grounded and profile-grounded interviews, auto-generated when verification settles — with an email inviting the candidate in.",
    icon: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      </>
    ),
  },
  {
    span: "",
    title: "Two-way matching",
    desc: "pgvector cosine similarity inside a hard-filtered pool, fused into one rank score. Same number, both feeds.",
    icon: (
      <>
        <circle cx="8" cy="12" r="3.5" />
        <circle cx="16" cy="12" r="3.5" />
        <path d="M11.5 12h1" strokeLinecap="round" />
      </>
    ),
  },
  {
    span: "",
    title: "Evidence card",
    desc: "The interview report is written once and never overwritten — each row records the rubric version it was scored under.",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
        <path d="M9 8.5h6M9 12h6M9 15.5h4" strokeLinecap="round" />
      </>
    ),
  },
  {
    span: "md:col-span-2",
    title: "Recruiter pipeline, enforced server-side",
    desc: "Smart Apply snapshots the candidate's evidence at apply time — no data re-entry. The Kanban board enforces its state machine in the API: APPLIED → SHORTLISTED → INTERVIEW_SCHEDULED → HIRED, with REJECTED reachable from any non-terminal state. An illegal transition returns 409 instead of being silently ignored.",
    icon: (
      <>
        <path d="M4 6h7M4 12h4M4 18h7" strokeLinecap="round" />
        <path d="M15 6h5M17.5 12h2.5M15 18h5" strokeLinecap="round" />
      </>
    ),
  },
];

const STACK = [
  {
    name: "FastAPI",
    desc: "Async Python API · /api/v1 versioning · OpenAPI docs",
    accent: "from-orange-400 to-amber-600",
    icon: <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" strokeLinejoin="round" />,
  },
  {
    name: "PostgreSQL + pgvector",
    desc: "UUID keys · timestamptz · native enums · Alembic migrations",
    accent: "from-amber-300 to-orange-600",
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
    accent: "from-orange-500 to-red-500",
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
    accent: "from-yellow-400 to-amber-600",
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
    accent: "from-stone-400 to-orange-700",
    icon: (
      <>
        <path d="M4 8h6v6H4zM10 8h6v6h-6zM4 14h6v3H4zM10 14h6v3h-6zM16 8h4v9h-4z" strokeLinejoin="round" />
      </>
    ),
  },
  {
    name: "Pytest",
    desc: "13 integration tests · real Postgres · rolled back",
    accent: "from-orange-300 to-amber-500",
    icon: (
      <>
        <path d="M9 11.5 11 14l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      </>
    ),
  },
];

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/health", desc: "Service + database liveness probe", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { method: "POST", path: "/api/v1/auth/register", desc: "Create account — candidate or recruiter", tone: "text-orange-300 bg-orange-400/10 border-orange-400/20" },
  { method: "POST", path: "/api/v1/auth/login", desc: "Authenticate — mint JWT + session cookies", tone: "text-orange-300 bg-orange-400/10 border-orange-400/20" },
  { method: "POST", path: "/api/v1/auth/refresh", desc: "Rotate refresh token (CSRF-guarded)", tone: "text-orange-300 bg-orange-400/10 border-orange-400/20" },
  { method: "GET", path: "/api/v1/auth/me", desc: "Current user — protected route", tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20" },
  { method: "POST", path: "/api/v1/auth/logout", desc: "End session — clear cookies server-side", tone: "text-orange-300 bg-orange-400/10 border-orange-400/20" },
];

const LIVE_NOW = ["JWT auth with refresh rotation", "Versioned REST API + OpenAPI docs", "PostgreSQL + Alembic migrations", "Docker Compose one-command env"];
const NEXT_UP = ["Evidence verification workers", "Code-grounded AI interviews", "Two-way matching engine", "Recruiter Kanban pipeline", "Messaging + analytics"];

function highlight(word: string, key: number) {
  return (
    <span key={key} className="gradient-text glow-orange-text">
      {word}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Backdrop />
      <Navbar />

      {/* ================= HERO ================= */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pt-32 sm:pt-36">
        <section className="relative flex flex-col items-center text-center">
          <div className="hero-in" style={{ "--hero-delay": "0ms" } as React.CSSProperties}>
            <span className="section-kicker">
              <span className="dot-live" />
              AI-verified talent marketplace
            </span>
          </div>
          <h1
            className="hero-in mt-7 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
            style={{ "--hero-delay": "120ms" } as React.CSSProperties}
          >
            <WordReveal text="Hire on *proof,*" stagger={110} highlight={highlight} />
            <br />
            <WordReveal text="not *promises.*" stagger={110} highlight={highlight} />
          </h1>
          <p
            className="hero-in mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
            style={{ "--hero-delay": "500ms" } as React.CSSProperties}
          >
            Every candidate skill backed by real evidence — verified GitHub work, coding-platform
            records, reachable certificates, and code-grounded AI interviews. Candidates and jobs
            matched on that same evidence, with the identical score shown to both sides.
          </p>
          <div
            className="hero-in mt-9 flex flex-wrap items-center justify-center gap-4"
            style={{ "--hero-delay": "650ms" } as React.CSSProperties}
          >
            <Link to="/register" className="btn-primary-glow">
              Get started
              <span aria-hidden="true">→</span>
            </Link>
            <a href="#status" className="btn-ghost">
              <span className="dot-live" />
              See live status
            </a>
          </div>

          {/* AI chip centerpiece + floating chips */}
          <div
            className="hero-in relative mt-6 w-full max-w-3xl"
            style={{ "--hero-delay": "800ms" } as React.CSSProperties}
          >
            <AiChip className="mx-auto aspect-square w-full max-w-[560px]" />
            <FloatingChips
              chips={[
                {
                  content: (
                    <>
                      <span className="dot-live" />
                      <span className="font-semibold text-emerald-300">VERIFIED</span>
                    </>
                  ),
                  className: "left-[2%] top-[16%]",
                  depth: 22,
                  floatClass: "animate-float-slow",
                },
                {
                  content: (
                    <>
                      <span className="font-mono font-bold text-orange-300">94</span>
                      <span className="text-slate-400">match score</span>
                    </>
                  ),
                  className: "right-[2%] top-[24%]",
                  depth: 30,
                  floatClass: "animate-float-slower",
                },
                {
                  content: (
                    <>
                      <span className="font-mono text-slate-300">GitHub</span>
                      <span className="text-slate-500">· 212 commits</span>
                    </>
                  ),
                  className: "bottom-[24%] left-[6%]",
                  depth: 16,
                  floatClass: "animate-float-slower",
                },
                {
                  content: (
                    <>
                      <span className="font-mono text-slate-300">interview</span>
                      <span className="font-bold text-amber-300">8.7 / 10</span>
                    </>
                  ),
                  className: "bottom-[16%] right-[5%]",
                  depth: 26,
                  floatClass: "animate-float-slow",
                },
              ]}
            />
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div className="glass px-4 py-5 text-center">
                <p className="gradient-text text-3xl font-black">{s.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section id="how" className="mx-auto mt-28 max-w-6xl scroll-mt-28">
          <Reveal>
            <div className="mb-12 text-center">
              <span className="section-kicker">How it works</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <WordReveal text="The *evidence* loop" stagger={100} highlight={highlight} />
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Three stages. Each one gates the next — so nobody is ever embedded, interviewed
                or discoverable without earning it.
              </p>
            </div>
          </Reveal>
          <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3">
            <div
              aria-hidden="true"
              className="flow-line absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent md:block"
            />
            {HOW.map((f, i) => (
              <Reveal key={f.n} delay={i * 130}>
                <div className="card-dark card-hover relative h-full">
                  <span className="gradient-text font-mono text-sm font-bold">{f.n}</span>
                  <h3 className="mt-2 text-xl font-bold text-white">{f.title}</h3>
                  <p className="mt-1 font-semibold text-orange-200/90">{f.headline}</p>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= BENTO ================= */}
        <section id="features" className="mx-auto mt-28 max-w-6xl scroll-mt-28">
          <Reveal>
            <div className="mb-10 text-center">
              <span className="section-kicker">Under the hood</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <WordReveal text="Built for *trust*" stagger={100} highlight={highlight} />
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                The full marketplace loop — verification to interview to matching to hire —
                designed so every number shown has a receipt behind it.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {BENTO.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 110} className={b.span}>
                <div className="card-dark card-hover group h-full">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-[0_0_24px_-6px_rgba(249,115,22,0.7)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
                      {b.icon}
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ================= GLOBE / MATCHING ================= */}
        <section className="mx-auto mt-28 grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="section-kicker">Two-way matching</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <WordReveal text="One score. *Both* sides." stagger={100} highlight={highlight} />
              </h2>
              <p className="mt-4 max-w-lg leading-relaxed text-slate-400">
                A relational pre-filter bounds the candidate pool — discoverability, graduation
                window, location, deadline — then cosine similarity ranks inside it. Five
                configurable terms fuse into a single score:
              </p>
              <div className="mt-5 max-w-lg rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-4 font-mono text-[13px] leading-relaxed text-orange-100/90">
                match = 100 × (0.40·semantic + 0.25·skill_evidence
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.15·interview + 0.10·competency
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0.10·profile_strength)
              </div>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-500">
                Below the threshold a pair is absent from <span className="text-slate-300">both</span> feeds —
                not hidden at read time. Closing a job prunes its rows, so the two sides can never drift.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <DottedGlobe className="mx-auto aspect-square w-full max-w-[480px]" />
          </Reveal>
        </section>
      </main>

      {/* ================= LIGHT BAND — LIVE PROOF ================= */}
      <section id="status" className="mt-28 scroll-mt-20 bg-[#f4f1ea]">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Reveal>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-600/25 bg-orange-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              <span className="dot-live" />
              Live proof
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              <WordReveal text="Experience it *now.*" stagger={100} highlight={highlight} />
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              This terminal hits the real <span className="font-mono text-slate-800">/api/v1/health</span>{" "}
              endpoint — FastAPI → PostgreSQL round-trip — and refreshes every 10 seconds.
              Phase 1 is deployed and talking.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-10 text-left">
              <StatusTerminal />
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register" className="btn-primary-glow">
                Try the auth flow
                <span aria-hidden="true">→</span>
              </Link>
              <a
                href="/docs"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-900/15 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-800 backdrop-blur transition-all duration-300 hover:border-slate-900/30 hover:bg-white active:scale-[0.98]"
              >
                OpenAPI docs
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= STACK + ENDPOINTS (dark again) ================= */}
      <div className="mx-auto w-full max-w-6xl px-5">
        <section id="stack" className="mx-auto mt-28 max-w-6xl scroll-mt-28">
          <Reveal>
            <div className="mb-10 text-center">
              <span className="section-kicker">Foundation</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <WordReveal text="Production-grade *stack*" stagger={100} highlight={highlight} />
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

        <section id="endpoints" className="mx-auto mt-28 max-w-4xl scroll-mt-28">
          <Reveal>
            <div className="mb-8 text-center">
              <span className="section-kicker">API surface</span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                <WordReveal text="Six endpoints. *Zero* placeholders." stagger={90} highlight={highlight} />
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

        {/* ================= ROADMAP ================= */}
        <section className="mx-auto mt-28 max-w-5xl">
          <Reveal>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="glass p-8">
                <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  <span className="dot-live" />
                  Live now — Phase 1
                </span>
                <ul className="mt-4 space-y-2.5">
                  {LIVE_NOW.map((x) => (
                    <li key={x} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-0.5 font-bold text-emerald-400">✓</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass p-8">
                <span className="section-kicker">Next — the marketplace loop</span>
                <ul className="mt-4 space-y-2.5">
                  {NEXT_UP.map((x) => (
                    <li key={x} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="mt-0.5 font-bold text-orange-400">→</span>
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <footer className="mt-24 border-t border-white/[0.07] py-8 text-center">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-300">GroundTruth AI</span> — the AI-verified talent
          marketplace · Phase 1 live
        </p>
        <p className="mt-1 font-mono text-xs text-slate-600">gauravdev95 · final-year project</p>
      </footer>
    </div>
  );
}
