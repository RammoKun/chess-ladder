"use client";

import { useMemo, useState, useEffect } from "react";
import { LeaderboardRow } from "@/components/LeaderboardRow";
import { TagFilter } from "@/components/TagFilter";
import { TopNav } from "@/components/TopNav";
import { useStudents } from "@/hooks/useRealtimeData";
import { AdminGate } from "@/components/AdminGate";
import { getAllTags } from "@/lib/api";
import { calculateAdjustedScore, formatAdjustedScore } from "@/lib/utils";
import useSWR from "swr";
import { tagsEqualCaseInsensitive } from "@/utils/tags";

type Tab = "weekly" | "monthly" | "allTime";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("weekly");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clientReady, setClientReady] = useState(false);
  const { data: students = [], isLoading } = useStudents();
  const { data: allTags = [] } = useSWR("all-tags", getAllTags);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const sorted = useMemo(() => {
    const scoreKey = tab === "weekly" ? "weekly_points" : tab === "monthly" ? "monthly_points" : "all_time_points";
    const filteredStudents =
      selectedTags.length === 0
        ? students
        : students.filter((student) => (student.tags ?? []).some((tag) => selectedTags.some((selected) => tagsEqualCaseInsensitive(tag, selected))));

    return [...filteredStudents].sort((a, b) => {
      const scoreA = a[scoreKey];
      const scoreB = b[scoreKey];
      const normalizedA = calculateAdjustedScore(scoreA, a.sessions_attended);
      const normalizedB = calculateAdjustedScore(scoreB, b.sessions_attended);
      const scoreDiff = normalizedB - normalizedA;
      if (scoreDiff !== 0) return scoreDiff;
      const disciplineA = a.weekly_points + a.monthly_points;
      const disciplineB = b.weekly_points + b.monthly_points;
      if (disciplineB !== disciplineA) return disciplineB - disciplineA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [students, tab, selectedTags]);

  if (!clientReady) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-[#FFD700]">Leaderboard</h1>
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        </header>
        <div className="grid gap-3">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="h-16 w-full animate-pulse rounded-2xl bg-zinc-800" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-[#FFD700]">Leaderboard</h1>
        <TopNav />
      </header>
      <div className="mb-4 flex gap-2">
        <TabButton active={tab === "weekly"} onClick={() => setTab("weekly")} label="Weekly" />
        <TabButton active={tab === "monthly"} onClick={() => setTab("monthly")} label="Monthly" />
        <TabButton active={tab === "allTime"} onClick={() => setTab("allTime")} label="All Time" />
      </div>
      <TagFilter allTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
      {isLoading ? <p className="text-sm text-zinc-400">Loading leaderboard...</p> : null}
      <section className="grid gap-3">
        {sorted.map((student, index) => {
          const score = tab === "weekly" ? student.weekly_points : tab === "monthly" ? student.monthly_points : student.all_time_points;
          const trend = student.weekly_points;
          const adjustedLabel = formatAdjustedScore(score, student.sessions_attended);

          return (
            <LeaderboardRow
              key={student.id}
              student={student}
              rank={index + 1}
              score={score}
              trend={trend}
              adjustedLabel={adjustedLabel}
              showTags
            />
          );
        })}
      </section>
      </main>
    </AdminGate>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active ? "bg-[#FFD700] text-zinc-900" : "border border-zinc-700 bg-[#111111] text-zinc-100"
      }`}
    >
      {label}
    </button>
  );
}
