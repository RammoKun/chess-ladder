"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { addAdmin, listAdmins, listLogs, removeAdmin, resetMonthlyScores, resetWeeklyScores } from "@/lib/api";
import { TopNav } from "@/components/TopNav";
import { useToast } from "@/components/ToastProvider";
import { mutate } from "swr";
import useSWR from "swr";
import { AdminGate } from "@/components/AdminGate";

export default function SettingsPage() {
  const { success, error } = useToast();
  const { data: admins = [] } = useSWR("admins", listAdmins);
  const [email, setEmail] = useState("");
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  async function onAddAdmin(event: FormEvent) {
    event.preventDefault();
    try {
      if (!email.trim()) return;
      await addAdmin(email.trim().toLowerCase());
      setEmail("");
      await mutate("admins");
      success("Admin added.");
    } catch (requestError) {
      error(requestError instanceof Error ? requestError.message : "Failed to add admin.");
    }
  }

  async function exportLogsCsv() {
    try {
      const logs = await listLogs();
      const header = ["student_id", "action_type", "points", "created_at"];
      const rows = logs.map((log) => [log.student_id, log.action_type, String(log.points), log.created_at]);
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const uri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
      const link = document.createElement("a");
      link.href = uri;
      link.download = "chess-ladder-logs.csv";
      document.body.append(link);
      link.click();
      link.remove();
      success("CSV exported.");
    } catch (requestError) {
      error(requestError instanceof Error ? requestError.message : "Failed to export CSV.");
    }
  }

  if (!clientReady) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-[#FFD700]">Settings</h1>
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        </header>
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 w-full animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-[#FFD700]">Settings</h1>
        <TopNav />
      </header>

      <section className="grid gap-3">
        <Link href="/settings/tags" className="card p-4 text-left">
          <p className="font-semibold">Manage batch tags</p>
          <p className="text-xs text-zinc-400">Create, rename, delete, and merge tags used by students.</p>
        </Link>

        <button
          type="button"
          onClick={async () => {
            try {
              await resetWeeklyScores();
              await mutate("students");
              success("Weekly scores reset.");
            } catch (requestError) {
              error(requestError instanceof Error ? requestError.message : "Failed to reset weekly scores.");
            }
          }}
          className="card p-4 text-left"
        >
          <p className="font-semibold">Reset weekly scores</p>
          <p className="text-xs text-zinc-400">Runs `reset_weekly_scores_manually()` (with SQL fallback) to zero weekly points.</p>
        </button>

        <button
          type="button"
          onClick={async () => {
            try {
              await resetMonthlyScores();
              await mutate("students");
              success("Monthly scores reset.");
            } catch (requestError) {
              error(requestError instanceof Error ? requestError.message : "Failed to reset monthly scores.");
            }
          }}
          className="card p-4 text-left"
        >
          <p className="font-semibold">Reset monthly scores</p>
          <p className="text-xs text-zinc-400">Set `monthly_points` to 0 for all students.</p>
        </button>

        <button type="button" onClick={exportLogsCsv} className="card p-4 text-left">
          <p className="font-semibold">Export logs to CSV</p>
          <p className="text-xs text-zinc-400">One-tap export of full action history.</p>
        </button>
      </section>

      <section className="mt-5 card p-4">
        <p className="mb-3 text-xs text-zinc-500">
          Weekly automation is handled by pg_cron in the database. Manual reset uses the same RPC.
        </p>
        <h2 className="font-semibold">Manage Admins</h2>
        <form onSubmit={onAddAdmin} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@email.com"
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
          />
          <button type="submit" className="rounded-xl bg-[#FFD700] px-4 py-3 text-sm font-semibold text-zinc-900">
            Add Admin
          </button>
        </form>
        <div className="mt-3 grid gap-2">
          {admins.map((admin) => (
            <article key={admin.id} className="flex items-center justify-between rounded-xl border border-zinc-800 p-3 text-sm">
              <p>{admin.email}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await removeAdmin(admin.id);
                    await mutate("admins");
                    success("Admin removed.");
                  } catch (requestError) {
                    error(requestError instanceof Error ? requestError.message : "Failed to remove admin.");
                  }
                }}
                className="rounded-lg border border-zinc-700 px-3 py-1"
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
      </main>
    </AdminGate>
  );
}
