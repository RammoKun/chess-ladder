import Link from "next/link";

const routes = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
];

export function TopNav() {
  return (
    <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className="rounded-xl border border-zinc-700 bg-[#111111] px-3 py-2 text-center text-sm font-medium transition hover:border-[#FFD700]/40"
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
