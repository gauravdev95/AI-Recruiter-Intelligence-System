import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAccessToken } from "../../lib/tokenStore";
import type { UserRole } from "../../lib/types";
import AuthShell from "./AuthShell";

/** Register page: full name / email / password / role. On success, stores the
 * access token in memory and navigates to /account. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("candidate");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const auth = await api.register({
        email,
        password,
        role,
        ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
      });
      setAccessToken(auth.access_token);
      navigate("/account");
    } catch (err) {
      setError(getApiErrorMessage(err, "Registration failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Join as a candidate or recruiter.">
      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="register-name" className="label-dark">
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-dark"
            placeholder="Ada Lovelace"
          />
        </div>
        <div>
          <label htmlFor="register-email" className="label-dark">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="register-password" className="label-dark">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label htmlFor="register-role" className="label-dark">
            Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["candidate", "recruiter"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                aria-pressed={role === r}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition-all duration-200 ${
                  role === r
                    ? "border-brand-500/60 bg-brand-500/15 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]"
                    : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/25 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary-glow w-full">
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
