import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { getAccessToken, setAccessToken } from "../lib/tokenStore";

/** Sticky glass navbar — dark theme. */
export default function Navbar() {
  const navigate = useNavigate();
  const isAuthed = Boolean(getAccessToken());

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

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#05070f]/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-sm font-black text-white shadow-[0_0_24px_-4px_rgba(249,115,22,0.8)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6">
            AI
          </span>
          <span className="text-[15px] font-bold tracking-tight text-white">
            Recruiter<span className="gradient-text"> Intelligence</span>
          </span>
        </Link>
        <div className="flex items-center gap-2.5 text-sm">
          {isAuthed ? (
            <>
              <Link
                to="/account"
                className="rounded-lg px-3.5 py-2 font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 font-medium text-slate-200 transition-all hover:border-white/30 hover:bg-white/10"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-2 font-semibold text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.7)] transition-all hover:brightness-110"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
