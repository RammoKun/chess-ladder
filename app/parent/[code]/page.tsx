"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { listLogs, listStudentsForParent } from "@/lib/api";
import { TierBadge } from "@/components/TierBadge";

export default function ParentCodePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toLowerCase();
  const { data: students = [] } = useSWR("parent-students", listStudentsForParent);
  const student = students.find((item) => item.student_code.toLowerCase() === code);
  const { data: logs = [] } = useSWR(student?.id ? `parent-code-logs-${student.id}` : null, () => listLogs(student?.id));
  const parentSafeLogs = useMemo(
    () =>
      logs.filter((log) => {
        const action = log.action_type.toLowerCase();
        return !action.includes("attendance") && !action.includes("section") && !action.includes("session");
      }),
    [logs]
  );

  if (!student) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 pb-16">
        <div className="card p-6 text-center text-sm text-zinc-400">Student not found for this code.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 pb-16">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-[#FFD700]">Parent Access</h1>
        <p className="text-sm text-zinc-400">Read-only student profile and history.</p>
      </header>

      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{student.name}</h2>
          <TierBadge tier={student.tier} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <ScoreItem label="Weekly Rank Score" value={student.weekly_points} />
          <ScoreItem label="Monthly Rank Score" value={student.monthly_points} />
          <ScoreItem label="All Time Rank Score" value={student.all_time_points} />
        </div>
        <h3 className="mt-4 font-semibold">History</h3>
        <div className="mt-2 grid max-h-72 gap-2 overflow-auto">
          {parentSafeLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-zinc-800 p-3 text-sm">
              <p>{log.action_type}</p>
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
    </main>
  );
}

function ScoreItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
