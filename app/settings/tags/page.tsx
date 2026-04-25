"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { useStudents } from "@/hooks/useRealtimeData";
import { addTagToStudent, deleteTagFromAllStudents, getAllTags, mergeTags, updateTagName } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { AdminGate } from "@/components/AdminGate";
import { mutate } from "swr";
import useSWR from "swr";
import { isValidTagName, normalizeTagName, tagsEqualCaseInsensitive } from "@/utils/tags";

export default function TagSettingsPage() {
  const { data: students = [] } = useStudents();
  const { data: allTags = [] } = useSWR("all-tags", getAllTags);
  const { success, error } = useToast();
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState("");
  const [editingValue, setEditingValue] = useState("");
  const [mergeFrom, setMergeFrom] = useState("");
  const [mergeInto, setMergeInto] = useState("");
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const tagCounts = useMemo(() => {
    return allTags.map((tag) => ({
      tag,
      count: students.filter((student) => (student.tags ?? []).some((studentTag) => tagsEqualCaseInsensitive(studentTag, tag))).length,
    }));
  }, [allTags, students]);

  async function refreshData() {
    await Promise.all([mutate("students"), mutate("all-tags")]);
  }

  if (!clientReady) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-[#FFD700]">Manage Batch Tags</h1>
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        </header>
        <div className="card p-4">
          <div className="h-6 w-32 animate-pulse rounded bg-zinc-800 mb-3" />
          <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        </div>
      </main>
    );
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
        <header className="mb-4">
          <h1 className="text-xl font-bold text-[#FFD700]">Manage Batch Tags</h1>
          <TopNav />
        </header>

        <section className="card p-4">
          <h2 className="font-semibold">Create New Tag</h2>
          <form
            onSubmit={async (event: FormEvent) => {
              event.preventDefault();
              const normalized = normalizeTagName(newTagName);
              if (!normalized) return;
              if (!isValidTagName(normalized)) {
                error("Tag must be 1-50 chars and only use letters, numbers, spaces, - or _.");
                return;
              }
              try {
                if (students.length === 0) {
                  error("Create at least one student first.");
                  return;
                }
                await addTagToStudent(students[0].id, normalized);
                await refreshData();
                setNewTagName("");
                success("Tag created.");
              } catch (requestError) {
                error(requestError instanceof Error ? requestError.message : "Failed to create tag.");
              }
            }}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="Type any tag name..."
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
            />
            <button type="submit" className="rounded-xl bg-[#FFD700] px-4 py-3 text-sm font-semibold text-zinc-900">
              + Create New Tag
            </button>
          </form>
        </section>

        <section className="mt-4 card p-4">
          <h2 className="font-semibold">Merge Tags</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select value={mergeFrom} onChange={(event) => setMergeFrom(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">
              <option value="">Merge from...</option>
              {allTags.map((tag) => (
                <option key={`from-${tag}`} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <select value={mergeInto} onChange={(event) => setMergeInto(event.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">
              <option value="">Merge into...</option>
              {allTags.map((tag) => (
                <option key={`into-${tag}`} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                if (!mergeFrom || !mergeInto || tagsEqualCaseInsensitive(mergeFrom, mergeInto)) return;
                try {
                  await mergeTags(mergeFrom, mergeInto);
                  await deleteTagFromAllStudents(mergeFrom);
                  await refreshData();
                  setMergeFrom("");
                  success("Tags merged.");
                } catch (requestError) {
                  error(requestError instanceof Error ? requestError.message : "Failed to merge tags.");
                }
              }}
              className="rounded-xl border border-zinc-700 p-3 text-sm hover:border-[#FFD700]/40"
            >
              Merge
            </button>
          </div>
        </section>

        <section className="mt-4 card p-4">
          <h2 className="font-semibold">All Tags</h2>
          <div className="mt-3 grid gap-2">
            {tagCounts.map(({ tag, count }) => (
              <article key={tag} className="grid gap-2 rounded-xl border border-zinc-800 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                {editingTag === tag ? (
                  <input
                    value={editingValue}
                    onChange={(event) => setEditingValue(event.target.value)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-sm"
                  />
                ) : (
                  <p className="font-medium">{tag}</p>
                )}
                <p className="text-sm text-zinc-400">{count} students</p>
                <div className="flex gap-2">
                  {editingTag === tag ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateTagName(tag, editingValue);
                          await refreshData();
                          setEditingTag("");
                          setEditingValue("");
                          success("Tag renamed.");
                        } catch (requestError) {
                          error(requestError instanceof Error ? requestError.message : "Failed to rename tag.");
                        }
                      }}
                      className="rounded-lg bg-[#FFD700] px-3 py-1 text-xs font-semibold text-zinc-900"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTag(tag);
                        setEditingValue(tag);
                      }}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = window.confirm(`Delete tag "${tag}" from all students?`);
                      if (!confirmed) return;
                      try {
                        await deleteTagFromAllStudents(tag);
                        await refreshData();
                        success("Tag deleted.");
                      } catch (requestError) {
                        error(requestError instanceof Error ? requestError.message : "Failed to delete tag.");
                      }
                    }}
                    className="rounded-lg border border-rose-600/60 px-3 py-1 text-xs text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {tagCounts.length === 0 ? <p className="text-sm text-zinc-400">No tags found yet.</p> : null}
          </div>
        </section>
      </main>
    </AdminGate>
  );
}
