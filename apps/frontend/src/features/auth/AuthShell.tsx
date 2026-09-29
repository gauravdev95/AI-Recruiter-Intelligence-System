import type { ReactNode } from "react";

import Navbar from "../../components/Navbar";

/** Shared shell for auth pages: animated dark backdrop + centered card. */
export default function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="bg-grid mask-fade-radial absolute inset-0" />
        <div className="animate-float-slow absolute -top-24 left-[15%] h-[380px] w-[380px] rounded-full bg-brand-600/25 blur-[120px]" />
        <div className="animate-float-slower absolute bottom-[-10%] right-[10%] h-[320px] w-[320px] rounded-full bg-violet-600/20 blur-[120px]" />
      </div>
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-28">
        <div className="hero-in glass-strong p-8 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.3)]" style={{ "--hero-delay": "80ms" } as React.CSSProperties}>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
