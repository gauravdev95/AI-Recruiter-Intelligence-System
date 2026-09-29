import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAccessToken } from "../../lib/tokenStore";
import type { User } from "../../lib/types";

/** Protected account page — proves auth end-to-end: fetches the current user
 * via /api/v1/auth/me and offers logout. */
export default function AccountPage() {
  const navigate = useNavigate();
  const meQuery = useQuery<User>({
    queryKey: ["me"],
    queryFn: api.me,
  });

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      // Best-effort: still clear the client-side session.
    } finally {
      setAccessToken(null);
      navigate("/");
    }
  }

  const user = meQuery.data;

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-grid mask-fade-radial absolute inset-0" />
        <div className="animate-float-slow absolute -top-24 right-[15%] h-[360px] w-[360px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="animate-float-slower absolute bottom-[-10%] left-[10%] h-[300px] w-[300px] rounded-full bg-brand-600/20 blur-[120px]" />
      </div>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-28">
        <div
          className="hero-in glass-strong p-8 shadow-[0_30px_80px_-20px_rgba(52,211,153,0.25)]"
          style={{ "--hero-delay": "80ms" } as React.CSSProperties}
        >
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Account</h1>
            {user && <StatusBadge tone={user.role === "recruiter" ? "blue" : "slate"}>{user.role}</StatusBadge>}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <span className="dot-live" />
              Authenticated session
            </span>
            <span className="mt-1 block font-mono text-xs text-slate-500">GET /api/v1/auth/me</span>
          </p>

          {meQuery.isPending && (
            <div className="mt-6 space-y-3" aria-label="Loading">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
              ))}
            </div>
          )}

          {meQuery.isError && (
            <div role="alert" className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300">
              {getApiErrorMessage(meQuery.error, "Could not load your account.")}
            </div>
          )}

          {user && (
            <dl className="mt-6 space-y-3 text-sm">
              {(
                [
                  ["Email", user.email, false],
                  ["Full name", user.full_name ?? "—", false],
                  ["User ID", user.id, true],
                ] as const
              ).map(([label, value, mono]) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dt>
                  <dd className={`mt-1 text-slate-100 ${mono ? "break-all font-mono text-xs" : ""}`}>{value}</dd>
                </div>
              ))}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</dt>
                <dd className="mt-1.5">
                  <StatusBadge tone={user.is_active ? "green" : "red"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </StatusBadge>
                </dd>
              </div>
            </dl>
          )}

          <button type="button" onClick={() => void handleLogout()} className="btn-ghost mt-7 w-full">
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
