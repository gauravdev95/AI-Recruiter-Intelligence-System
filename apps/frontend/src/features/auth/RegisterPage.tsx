import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { setAccessToken } from "../../lib/tokenStore";
import type { UserRole } from "../../lib/types";

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
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="card">
          <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
          <p className="mt-1 text-sm text-slate-600">Join AI Recruiter Intelligence as a candidate or recruiter.</p>
          {error && (
            <div role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}
          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="register-name" className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Ada Lovelace"
              />
            </div>
            <div>
              <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-slate-700">
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
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label htmlFor="register-role" className="mb-1 block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="register-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="input-field"
              >
                <option value="candidate">Candidate</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Creating account…" : "Register"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
