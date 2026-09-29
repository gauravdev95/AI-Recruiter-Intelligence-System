import { Link } from "react-router-dom";

/** 404 page — dark theme. */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05070f] px-4 text-center">
      <p className="gradient-text text-7xl font-black">404</p>
      <p className="mt-3 text-lg text-slate-400">This page doesn't exist.</p>
      <Link to="/" className="btn-ghost mt-6">
        Back to home
      </Link>
    </div>
  );
}
