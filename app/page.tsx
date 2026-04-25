import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[#FFD700]/30 blur-3xl" />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#111111] p-6 shadow-xl">
        <div className="flex flex-col items-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/i11-logo.png" alt="i11 Chess Academy" className="h-20 w-auto mb-3 drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]" />
          <h2 className="text-xl font-bold text-[#FFD700]">i11 Chess Academy</h2>
          <p className="text-xs text-zinc-400 mt-1">Track Your Child&apos;s Chess Progress</p>
        </div>
        <div className="border-t border-zinc-800 pt-4">
          <p className="text-xs uppercase tracking-widest text-zinc-400">i11 Chess Academy</p>
          <h1 className="mt-1 text-3xl font-bold text-[#FFD700]">Chess Ladder</h1>
          <p className="mt-2 text-sm text-zinc-300">Live coaching leaderboard with instant updates.</p>
        </div>
        <div className="mt-6 grid gap-3">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-[#FFD700] p-4 text-center font-semibold text-zinc-900 transition hover:scale-[1.01]"
          >
            Admin Login
          </Link>
          <Link
            href="/parent"
            className="rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-center font-semibold transition hover:border-[#FFD700]/50"
          >
            Parent Access
          </Link>
        </div>
      </section>
      <footer className="mt-8 text-center text-xs text-zinc-500">
        © 2026 i11 Chess Academy • Powered by Chess Ladder
      </footer>
    </main>
  );
}
