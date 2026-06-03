import Link from "next/link";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("devboard_session")?.value;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_24%),linear-gradient(180deg,#020617_0%,#020617_45%,#0f172a_100%)]">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-brand-border bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-text/80">
            DevBoard
          </p>
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl">
            A Jira-style workspace for shipping real product work.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Projects, issues, auth, and backend-for-frontend routes are wired for a secure Next.js architecture. Use the dashboard to manage your work and keep backend tokens hidden behind HttpOnly cookies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover">
                Open Dashboard
              </Link>
            ) : (
              <Link href="/login" className="rounded-xl border border-brand-border bg-white/5 px-5 py-3 text-sm font-semibold text-brand-text transition hover:bg-white/10">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
