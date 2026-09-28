import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import Navbar from "../../components/Navbar";
import { api } from "../../lib/api";
import type { HealthResponse } from "../../lib/types";

/** Landing page: project hero + live backend/database connectivity status. */
export default function LandingPage() {
  const healthQuery = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: api.health,
    retry: 1,
    refetchInterval: 10000,
  });

  const data = healthQuery.data;
  const backendConnected = data?.status === "ok";
  const databaseHealthy = data?.database === "connected";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 py-16">
        <span className="rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Phase 1 — Project Foundation
        </span>
        <h1 className="mt-6 text-center text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          AI Recruiter Intelligence System
        </h1>
        <p className="mt-4 max-w-2xl text-center text-lg text-slate-600">
          An AI-powered hiring platform where every candidate skill is backed by
          verifiable evidence. This foundation release wires the frontend to the
          backend and proves authentication end-to-end.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Register
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Backend</h2>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${backendConnected ? "bg-green-500" : "bg-red-500"}`}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-900">
                {healthQuery.isPending
                  ? "Checking…"
                  : backendConnected
                    ? "Connected"
                    : "Disconnected"}
              </span>
            </div>
            {healthQuery.isError && (
              <p className="mt-2 text-xs text-slate-500">
                Could not reach the API at the configured base URL.
              </p>
            )}
          </div>
          <div className="card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Database</h2>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-block h-3 w-3 rounded-full ${databaseHealthy ? "bg-green-500" : "bg-red-500"}`}
                aria-hidden="true"
              />
              <span className="font-medium text-slate-900">
                {healthQuery.isPending
                  ? "Checking…"
                  : databaseHealthy
                    ? "Healthy"
                    : "Unhealthy"}
              </span>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
        Phase 1 foundation — application features intentionally not implemented yet.
      </footer>
    </div>
  );
}
