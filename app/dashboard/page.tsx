"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createStudent, listLogs } from "@/lib/api";
import { useStudents } from "@/hooks/useRealtimeData";
import { useToast } from "@/components/ToastProvider";
import { TopNav } from "@/components/TopNav";
import useSWR, { mutate } from "swr";
import { AdminGate } from "@/components/AdminGate";
import { parseCommaSeparatedTags } from "@/utils/tags";

export default function DashboardPage() {
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const { data: students = [], isLoading } = useStudents();
  const { data: logs = [] } = useSWR("logs", () => listLogs());
  const { success, error } = useToast();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const topRanked = [...students].sort((a, b) => b.all_time_points - a.all_time_points)[0];
    const mostImproved = [...students].sort((a, b) => b.weekly_points - a.weekly_points)[0];
    const todayActions = logs.filter(
      (log) => new Date(log.created_at).toDateString() === new Date().toDateString()
    ).length;
    return {
      totalStudents: students.length,
      todayActions,
      topRanked: topRanked?.name ?? "-",
      mostImproved: mostImproved?.name ?? "-",
    };
  }, [students, logs]);

  async function onAddStudent(event: FormEvent) {
    event.preventDefault();
    try {
      if (!name.trim()) return;
      await createStudent({ name: name.trim(), photo_url: photoUrl.trim() || undefined, tags: parseCommaSeparatedTags(tagsInput) });
      await mutate("students");
      success("Student added successfully.");
      setName("");
      setPhotoUrl("");
      setTagsInput("");
      setOpen(false);
    } catch (requestError) {
      error(requestError instanceof Error ? requestError.message : "Failed to add student.");
    }
  }

  if (!clientReady) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <div className="h-7 w-64 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-3 h-10 w-full animate-pulse rounded-xl bg-zinc-800 sm:w-3/4" />
        </header>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="card p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
              <div className="mt-2 h-6 w-16 animate-pulse rounded bg-zinc-800" />
            </article>
          ))}
        </section>
        <section className="mt-6 card p-4">
          <div className="h-6 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="mt-2 h-4 w-full max-w-md animate-pulse rounded bg-zinc-800" />
          <div className="mt-4 h-10 w-32 animate-pulse rounded-xl bg-zinc-800" />
        </section>
        <p className="mt-4 text-center text-sm text-zinc-500">Loading dashboard…</p>
      </main>
    );
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/i11-logo.png" alt="i11 Chess Academy" className="h-12 w-auto drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]" />
            <div>
              <h1 className="text-xl font-bold text-[#FFD700]">i11 Chess Academy | Chess Ladder</h1>
              <p className="text-xs text-zinc-400">Admin Panel</p>
            </div>
          </div>
          <TopNav />
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Students" value={String(stats.totalStudents)} />
          <StatCard title="Today Actions" value={String(stats.todayActions)} />
          <StatCard title="Top Ranked" value={stats.topRanked} />
          <StatCard title="Most Improved" value={stats.mostImproved} />
        </section>

        <section className="mt-6 card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Quick Add Student</h2>
              <p className="text-sm text-zinc-400">Only name is required. Code/tier/scores auto-generated.</p>
            </div>
            <button
              type="button"
              className="rounded-xl bg-[#FFD700] px-4 py-2 text-sm font-semibold text-zinc-900"
              onClick={() => setOpen(true)}
            >
              Add Student
            </button>
          </div>
        </section>

        <section className="mt-6 card p-4">
          <h3 className="font-semibold">Quick Access</h3>
          {isLoading ? <p className="mt-3 text-sm text-zinc-400">Loading students...</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {students.slice(0, 8).map((student) => (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className="rounded-xl border border-zinc-700 p-3 text-sm hover:border-[#FFD700]/40 transition"
              >
                <div className="flex items-center gap-3">
                  {student.photo_url ? (
                    <img src={student.photo_url} className="w-10 h-10 rounded-full object-cover" alt={student.name} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-xs text-zinc-400">
                      {student.all_time_points} pts | {student.student_code}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {open ? (
          <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <form onSubmit={onAddStudent} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111111] p-4">
              <h3 className="text-lg font-semibold">Add Student</h3>
              <div className="mt-4 grid gap-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Student name"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
                />
                <input
                  value={photoUrl}
                  onChange={(event) => setPhotoUrl(event.target.value)}
                  placeholder="Photo URL (optional)"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
                />
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="Add batch tags (comma separated)"
                  className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-zinc-700 p-3 text-sm">
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-[#FFD700] p-3 text-sm font-semibold text-zinc-900">
                  Save
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </main>
    </AdminGate>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <article className="card p-4">
      <p className="text-xs uppercase text-zinc-400">{title}</p>
      <p className="mt-1 text-lg font-bold text-zinc-100">{value}</p>
    </article>
  );
}
