"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { TagFilter } from "@/components/TagFilter";
import { TopNav } from "@/components/TopNav";
import { useStudents } from "@/hooks/useRealtimeData";
import { AdminGate } from "@/components/AdminGate";
import { getAllTags } from "@/lib/api";
import { markAttendance } from "@/lib/attendance";
import { useToast } from "@/components/ToastProvider";
import { tagsEqualCaseInsensitive } from "@/utils/tags";
import useSWR, { mutate } from "swr";

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingStudentId, setLoadingStudentId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const { data: students = [], isLoading } = useStudents();
  const { data: allTags = [] } = useSWR("all-tags", getAllTags);
  const { success, error } = useToast();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setClientReady(true);
  }, []);

  const filteredStudents = useMemo(() => {
    const q = query.toLowerCase();
    const tagFiltered =
      selectedTags.length === 0
        ? students
        : students.filter((student) => (student.tags ?? []).some((tag) => selectedTags.some((selected) => tagsEqualCaseInsensitive(tag, selected))));

    return tagFiltered.filter((student) => student.name.toLowerCase().includes(q) || student.student_code.toLowerCase().includes(q));
  }, [students, query, selectedTags]);

  if (!clientReady) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-[#FFD700]">Students</h1>
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        </header>
        <div className="mb-4 h-12 w-full animate-pulse rounded-xl bg-zinc-800" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <div key={index} className="h-32 w-full animate-pulse rounded-2xl bg-zinc-800" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-[#FFD700]">Students</h1>
        <TopNav />
      </header>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search students..."
        className="mb-4 w-full rounded-xl border border-zinc-700 bg-[#111111] p-3 text-sm"
      />
      <TagFilter allTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
      {selectedTags.length > 0 ? (
        <button
          type="button"
          disabled={bulkLoading || filteredStudents.length === 0}
          onClick={async () => {
            try {
              setBulkLoading(true);
              let markedCount = 0;
              for (const student of filteredStudents) {
                const alreadyMarked = (student.attendance_dates ?? []).includes(today);
                if (alreadyMarked) continue;
                await markAttendance(student.id, false);
                markedCount += 1;
              }
              await Promise.all([mutate("students"), mutate("logs")]);
              success(markedCount > 0 ? `Marked ${markedCount} students present.` : "All filtered students are already marked today.");
            } catch (requestError) {
              error(requestError instanceof Error ? requestError.message : "Failed bulk attendance update.");
            } finally {
              setBulkLoading(false);
            }
          }}
          className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium hover:border-[#FFD700]/40 disabled:opacity-50"
        >
          {bulkLoading ? "Marking..." : "📋 Mark All Present"}
        </button>
      ) : null}
      {isLoading ? <p className="text-sm text-zinc-400">Loading...</p> : null}
      {!isLoading && filteredStudents.length === 0 ? (
        <div className="card p-6 text-center text-sm text-zinc-400">No students found.</div>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <article key={student.id} className="rounded-2xl border border-zinc-800 bg-[#111111] p-4 hover:border-[#FFD700]/40 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/students/${student.id}`} className="truncate font-semibold text-zinc-100 hover:text-[#FFD700] transition">
                    {student.name}
                  </Link>
                  <p className="text-xs text-zinc-400">{student.student_code}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 mb-2">
                    {student.photo_url ? (
                      <img src={student.photo_url} className="w-10 h-10 rounded-full object-cover" alt={student.name} />
                    ) : (
                      <span className="text-sm font-semibold">{student.name.charAt(0)}</span>
                    )}
                  </div>
                  {(student.tags ?? []).slice(0, 1).map((tag) => (
                    <span key={`${student.id}-${tag}`} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {/* Attendance Status */}
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  {(student.attendance_dates ?? []).includes(today) ? (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs">✓</span>
                      Present Today
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-xs">✗</span>
                      Not Present
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">📅 {student.sessions_attended} sessions</p>
              </div>
              {/* Action Buttons */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  title={(student.attendance_dates ?? []).includes(today) ? "Marked today" : "Mark student present for today"}
                  disabled={loadingStudentId === student.id || (student.attendance_dates ?? []).includes(today)}
                  onClick={async () => {
                    try {
                      setLoadingStudentId(student.id);
                      await markAttendance(student.id, false);
                      await Promise.all([mutate("students"), mutate("logs")]);
                      success(`${student.name} marked present.`);
                    } catch (requestError) {
                      error(requestError instanceof Error ? requestError.message : "Failed to mark attendance.");
                    } finally {
                      setLoadingStudentId("");
                    }
                  }}
                  className="rounded-xl border border-zinc-700 px-3 py-3 text-sm hover:border-[#FFD700]/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✅ Mark Present
                </button>
                <button
                  type="button"
                  disabled={loadingStudentId === student.id}
                  onClick={async () => {
                    try {
                      setLoadingStudentId(student.id);
                      await markAttendance(student.id, true);
                      await Promise.all([mutate("students"), mutate("logs")]);
                      success(`Extra session added for ${student.name}.`);
                    } catch (requestError) {
                      error(requestError instanceof Error ? requestError.message : "Failed to add session.");
                    } finally {
                      setLoadingStudentId("");
                    }
                  }}
                  className="rounded-xl border border-zinc-700 px-3 py-3 text-sm hover:border-[#FFD700]/40 disabled:opacity-50"
                >
                  ➕ Add Session
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      </main>
    </AdminGate>
  );
}
