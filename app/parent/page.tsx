"use client";

import { useMemo, useState } from "react";
import { TierBadge } from "@/components/TierBadge";
import { listLogs, listStudentsForParent } from "@/lib/api";
import { formatActionType } from "@/lib/utils";
import useSWR from "swr";
import type { Tier } from "@/types";

export default function ParentPage() {
  const { data: students = [], isLoading } = useSWR("parent-students", listStudentsForParent);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const selected = students.find((s) => s.id === selectedStudentId);
  const { data: logs = [] } = useSWR(selected?.id ? `parent-logs-${selected.id}` : null, () => listLogs(selected?.id));
  const parentSafeLogs = useMemo(
    () =>
      logs.filter((log) => {
        const action = log.action_type.toLowerCase();
        return !action.includes("attendance") && !action.includes("section") && !action.includes("session");
      }),
    [logs]
  );

  const sorted = useMemo(() => {
    return [...students].sort((a, b) => b.weekly_points - a.weekly_points);
  }, [students]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  // Search filter for student lookup
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (s) => s.name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  // Podium order: [2nd, 1st, 3rd] for proper visual layout
  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]]
    : top3;

  return (
    <main className="mx-auto w-full max-w-4xl p-4 pb-16">
      {/* Header with branding */}
      <header className="mb-8 text-center">
        <div className="flex flex-col items-center mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/i11-logo.png"
            alt="i11 Chess Academy"
            className="h-20 w-auto mb-3 drop-shadow-[0_0_12px_rgba(255,215,0,0.4)]"
          />
          <h2 className="text-xl font-bold text-[#FFD700]">i11 Chess Academy</h2>
          <p className="text-xs text-zinc-400 mt-1">Track Your Child&apos;s Chess Progress</p>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <ChessKnightSVG className="h-7 w-7 text-[#FFD700]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD700]">
            🏆 Leaderboard
          </h1>
          <ChessRookSVG className="h-7 w-7 text-[#FFD700]" />
        </div>
        <p className="text-sm text-zinc-400">Weekly Rankings • Updated Live</p>
      </header>

      {isLoading ? (
        <p className="text-center text-sm text-zinc-400">Loading leaderboard...</p>
      ) : null}

      {/* Podium: 2nd | 1st (elevated) | 3rd */}
      {top3.length > 0 && (
        <section className="mb-10">
          {/* Desktop: side-by-side podium */}
          <div className="hidden sm:flex items-end justify-center gap-4">
            {top3.length >= 2 && (
              <div className="w-56">
                <TopCard student={top3[1]} rank={2} />
              </div>
            )}
            <div className="w-64 -mt-6 z-10">
              <TopCard student={top3[0]} rank={1} />
            </div>
            {top3.length >= 3 && (
              <div className="w-56">
                <TopCard student={top3[2]} rank={3} />
              </div>
            )}
          </div>
          {/* Mobile: stacked vertically */}
          <div className="sm:hidden grid gap-4">
            <TopCard student={top3[0]} rank={1} />
            {top3.length >= 2 && <TopCard student={top3[1]} rank={2} />}
            {top3.length >= 3 && <TopCard student={top3[2]} rank={3} />}
          </div>
        </section>
      )}

      {/* Rest of leaderboard */}
      {rest.length > 0 && (
        <section className="mb-8 grid gap-2">
          {rest.map((student, index) => (
            <article
              key={student.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-[#111111] p-3 transition hover:border-zinc-600"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-zinc-400">
                {index + 4}
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold overflow-hidden">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{student.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-100">{student.name}</p>
                <TierBadge tier={student.tier} />
              </div>
              <p className="text-sm font-semibold text-zinc-200">{student.weekly_points} pts</p>
            </article>
          ))}
        </section>
      )}

      {sorted.length === 0 && !isLoading && (
        <div className="card p-6 text-center text-sm text-zinc-400">No students found.</div>
      )}

      {/* Student Lookup Section */}
      <section className="mt-4 border-t border-zinc-800 pt-6">
        <h2 className="text-lg font-bold text-[#FFD700] mb-3">🔍 Student Lookup</h2>
        <p className="text-sm text-zinc-400 mb-3">Search by name or student code to view profile.</p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Type student name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-[#111111] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#FFD700]/50 focus:ring-2 focus:ring-[#FFD700]/20"
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              type="button"
              onClick={() => setSelectedStudentId(student.id === selectedStudentId ? "" : student.id)}
              className={`rounded-xl border p-3 text-left transition ${
                student.id === selectedStudentId
                  ? "border-[#FFD700]/50 bg-[#FFD700]/5"
                  : "border-zinc-700 bg-[#111111] hover:border-zinc-500"
              }`}
            >
              <p className="font-medium">{student.name}</p>
              <p className="text-xs text-zinc-400">{student.student_code}</p>
            </button>
          ))}
          {filteredStudents.length === 0 && searchQuery.trim() && (
            <p className="text-sm text-zinc-400 col-span-2 text-center py-4">No student found matching &quot;{searchQuery}&quot;</p>
          )}
        </div>
      </section>

      {/* Selected Student Profile */}
      {selected ? (
        <section className="mt-5 card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <TierBadge tier={selected.tier} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ScoreItem label="Weekly" value={selected.weekly_points} />
            <ScoreItem label="Monthly" value={selected.monthly_points} />
            <ScoreItem label="All Time" value={selected.all_time_points} />
          </div>
          <h3 className="mt-4 font-semibold">History</h3>
          <div className="mt-2 grid max-h-72 gap-2 overflow-auto">
            {parentSafeLogs.map((log) => (
              <article key={log.id} className="rounded-xl border border-zinc-800 p-3 text-sm">
                <p>{formatActionType(log.action_type)}</p>
                <p className={`${log.points >= 0 ? "text-emerald-400" : "text-rose-400"} text-xs`}>
                  {log.points > 0 ? "+" : ""}
                  {log.points}
                </p>
                <p className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</p>
              </article>
            ))}
            {parentSafeLogs.length === 0 ? <p className="text-xs text-zinc-400">No visible history yet.</p> : null}
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-zinc-500">
        © 2026 i11 Chess Academy • Powered by Chess Ladder
      </footer>
    </main>
  );
}

/* ─── Score Item ─── */
function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

/* ─── Top 3 Card ─── */
function TopCard({
  student,
  rank,
}: {
  student: { id: string; name: string; tier: string; weekly_points: number; photo_url: string | null };
  rank: number;
}) {
  const config = {
    1: {
      icon: "🏆",
      gradient: "from-[#FFD700]/25 via-[#B8860B]/15 to-transparent",
      border: "border-[#FFD700]/60",
      ring: "ring-[#FFD700]/60",
      glow: "shadow-[0_0_40px_rgba(255,215,0,0.2)]",
      label: "🥇 1ST PLACE",
      iconSize: "text-4xl",
      avatarSize: "h-16 w-16 text-2xl",
      nameSize: "text-xl",
      scoreSize: "text-3xl",
    },
    2: {
      icon: "🥈",
      gradient: "from-[#C0C0C0]/20 via-[#A9A9A9]/10 to-transparent",
      border: "border-[#C0C0C0]/40",
      ring: "ring-[#C0C0C0]/40",
      glow: "shadow-[0_0_20px_rgba(192,192,192,0.1)]",
      label: "🥈 2ND PLACE",
      iconSize: "text-3xl",
      avatarSize: "h-14 w-14 text-xl",
      nameSize: "text-lg",
      scoreSize: "text-2xl",
    },
    3: {
      icon: "🥉",
      gradient: "from-[#CD7F32]/20 via-[#8B4513]/10 to-transparent",
      border: "border-[#CD7F32]/40",
      ring: "ring-[#CD7F32]/40",
      glow: "shadow-[0_0_20px_rgba(205,127,50,0.1)]",
      label: "🥉 3RD PLACE",
      iconSize: "text-3xl",
      avatarSize: "h-14 w-14 text-xl",
      nameSize: "text-lg",
      scoreSize: "text-2xl",
    },
  }[rank as 1 | 2 | 3]!;

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border-2 ${config.border} bg-gradient-to-b ${config.gradient} bg-[#111111] p-5 text-center ring-2 ${config.ring} ${config.glow} transition hover:scale-[1.02]`}
    >
      {/* Glow orb for #1 */}
      {rank === 1 && (
        <div className="pointer-events-none absolute -top-10 left-1/2 h-28 w-28 -translate-x-1/2 animate-pulse rounded-full bg-[#FFD700]/15 blur-2xl" />
      )}
      <div className={`${config.iconSize} mb-2`}>{config.icon}</div>
      <div className={`mx-auto ${config.avatarSize} rounded-full bg-zinc-800 font-bold mb-2 overflow-hidden`}>
        {student.photo_url ? (
          <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {student.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <p className={`font-semibold text-zinc-100 ${config.nameSize} truncate`}>{student.name}</p>
      <div className="mt-1 flex justify-center">
        <TierBadge tier={student.tier as Tier} />
      </div>
      <p className={`mt-2 ${config.scoreSize} font-bold text-[#FFD700]`}>{student.weekly_points}</p>
      <p className="text-xs text-zinc-400">weekly pts</p>
      <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{config.label}</p>
    </article>
  );
}

/* ─── Chess SVG Decorations ─── */
function ChessKnightSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 22H5v-2h14v2zm-3-4H8l-1-2v-4l3-1V8l-3-3V3h2l3 3h2l1 2v3l-3 1v4l1 2z" opacity="0.7" />
    </svg>
  );
}

function ChessRookSVG({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 20h14v2H5v-2zm1-2h12l1-3h-4V9h2V3h-2v2h-2V3h-2v2H9V3H7v6h2v6H5l1 3z" opacity="0.7" />
    </svg>
  );
}
