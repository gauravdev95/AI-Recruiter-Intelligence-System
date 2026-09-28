import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { getAccessToken, setAccessToken } from "../lib/tokenStore";

/** Top navigation bar. Shows Login/Register for guests, Account/Logout for sessions. */
export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = Boolean(getAccessToken());

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

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand-700">
          AI Recruiter Intelligence
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {isAuthed ? (
            <>
              <Link to="/account" className="font-medium text-slate-700 hover:text-brand-700">
                Account
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-medium text-slate-700 hover:text-brand-700">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
