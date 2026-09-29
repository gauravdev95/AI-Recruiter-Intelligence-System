import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAccessToken } from "../../lib/tokenStore";
import AuthShell from "./AuthShell";

/** Login page: email/password + remember-me. On success, stores the access
 * token in memory and navigates to /account. */
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const auth = await api.login({ email, password, remember_me: rememberMe });
      setAccessToken(auth.access_token);
      navigate("/account");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to AI Recruiter Intelligence.">
      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-3.5 py-2.5 text-sm text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="login-email" className="label-dark">
            Email
          </label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="label-dark">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
            placeholder="••••••••"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-500"
          />
          Remember me
        </label>
        <button type="submit" disabled={isSubmitting} className="btn-primary-glow w-full">
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Logging in…
            </>
          ) : (
            "Log in"
          )}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-400">
        No account?{" "}
        <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
