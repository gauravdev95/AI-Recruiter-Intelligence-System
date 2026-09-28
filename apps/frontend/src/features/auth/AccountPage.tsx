import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAccessToken } from "../../lib/tokenStore";
import type { User } from "../../lib/types";

/** Minimal protected account page — proves auth end-to-end: fetches the
 * current user via /api/v1/auth/me and offers logout. */
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
      // Best-effort: still clear the client-side session even if the
      // backend call fails (e.g. token already expired).
    } finally {
      setAccessToken(null);
      navigate("/");
    }
  }

  const user = meQuery.data;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="card">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Account</h1>
            {user && (
              <StatusBadge tone={user.role === "recruiter" ? "blue" : "slate"}>
                {user.role}
              </StatusBadge>
            )}
          </div>

          {meQuery.isPending && <p className="mt-6 text-sm text-slate-600">Loading your profile…</p>}

          {meQuery.isError && (
            <div role="alert" className="mt-6 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {getApiErrorMessage(meQuery.error, "Could not load your account.")}
            </div>
          )}

          {user && (
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="mt-0.5 text-slate-900">{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Full name</dt>
                <dd className="mt-0.5 text-slate-900">{user.full_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">User ID</dt>
                <dd className="mt-0.5 break-all font-mono text-xs text-slate-900">{user.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Status</dt>
                <dd className="mt-0.5">
                  <StatusBadge tone={user.is_active ? "green" : "red"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </StatusBadge>
                </dd>
              </div>
            </dl>
          )}

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
