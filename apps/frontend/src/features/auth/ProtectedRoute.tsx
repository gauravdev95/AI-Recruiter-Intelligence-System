import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { refreshAccessToken } from "../../lib/apiClient";
import { getAccessToken } from "../../lib/tokenStore";

interface ProtectedRouteProps {
  children: ReactNode;
}

/** Guards a route: if there is no in-memory access token, attempts one silent
 * refresh (the httpOnly cookie may still hold a valid session). Redirects to
 * /login when no session can be established. */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (getAccessToken()) {
        if (!cancelled) {
          setAuthed(true);
          setChecking(false);
        }
        return;
      }
      const token = await refreshAccessToken();
      if (!cancelled) {
        setAuthed(Boolean(token));
        setChecking(false);
      }
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Checking your session…
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
