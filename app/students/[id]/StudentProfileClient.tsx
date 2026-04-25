"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ActionButton";
import { ScoreModal } from "@/components/ScoreModal";
import { TagManager } from "@/components/TagManager";
import { TierBadge } from "@/components/TierBadge";
import { TopNav } from "@/components/TopNav";
import { useToast } from "@/components/ToastProvider";
import { AdminGate } from "@/components/AdminGate";
import { useLogs, useStudents } from "@/hooks/useRealtimeData";
import {
  addTagToStudent,
  applyCustomPoints,
  applyScoreAction,
  applyUnforcedDraw,
  deleteStudent,
  getStudentById,
  markStudentSession,
  removeTagFromStudent,
  renameStudent,
} from "@/lib/api";
import { ACTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { formatActionType } from "@/lib/utils";
import useSWR, { mutate } from "swr";

export function StudentProfileClient({ studentId }: { studentId: string }) {
  const router = useRouter();
  const { data: students = [] } = useStudents();
  const { data: student } = useSWR(`student-${studentId}`, () => getStudentById(studentId));
  const { data: logs = [] } = useLogs(studentId);
  const { success, error } = useToast();
  const [drawOpen, setDrawOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [customPoints, setCustomPoints] = useState("0");
  const [customNote, setCustomNote] = useState("");
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    return {
      MATCH: ACTIONS.filter((action) => action.category === "MATCH"),
      BEHAVIOR: ACTIONS.filter((action) => action.category === "BEHAVIOR"),
      GROWTH: ACTIONS.filter((action) => action.category === "GROWTH"),
    };
  }, []);
  const profileLogs = useMemo(
    () =>
      logs.filter((log) => {
        const action = log.action_type.toLowerCase();
        return !["mark_session", "attendance_mark_present", "attendance_add_session", "attendance_add_section"].includes(action);
      }),
    [logs]
  );

  if (!student) {
    return <main className="p-4 text-sm text-zinc-400">Loading student...</main>;
  }

  async function runAction(actionType: string, points: number) {
    if (!student) return;
    try {
      setLoadingAction(actionType);
      await applyScoreAction(student, actionType, points);
      await Promise.all([mutate("students"), mutate(`student-${studentId}`), mutate(`logs-${studentId}`), mutate("logs")]);
      success("Action applied.");
    } catch (requestError) {
      error(requestError instanceof Error ? requestError.message : "Failed to apply action.");
    } finally {
      setLoadingAction("");
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files?.[0];
      console.log("File selected:", file);
      
      if (!file || !student) return;
      console.log("File size:", file.size, "bytes");

      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log("File validation failed: not an image");
        error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log("File validation failed: exceeds 5MB");
        error('Image size should be less than 5MB');
        return;
      }

      console.log("File validation passed, uploading...");
      setPhotoUploading(true);
      console.log("Setting photoUploading to true");
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id}.${fileExt}`;
      console.log("Upload filename:", fileName);

      console.log("Uploading to Supabase...");
      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.log("Upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(fileName);
      
      console.log("Upload success:", data.publicUrl);

      console.log("Updating photo_url in database...");
      const updateResult = await supabase
        .from('students')
        .update({ photo_url: data.publicUrl })
        .eq('id', student.id);

      if (updateResult.error) {
        console.log("Database update error:", updateResult.error);
        throw updateResult.error;
      }
      console.log("Photo URL updated in database");

      console.log("Refreshing cache...");
      await Promise.all([mutate("students"), mutate(`student-${studentId}`)]);
      console.log("Cache refreshed, reloading page...");
      
      success('Photo updated successfully!');
      
      // Force page refresh to show new photo
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 500);
    } catch (requestError) {
      console.error("Upload error:", requestError);
      const errorMessage = requestError instanceof Error 
        ? requestError.message 
        : typeof requestError === 'object' 
          ? JSON.stringify(requestError)
          : 'Failed to upload photo';
      error(errorMessage);
    } finally {
      console.log("Setting photoUploading to false");
      setPhotoUploading(false);
    }
  }

  const handlePhotoClick = () => {
    console.log("Photo click handler called");
    console.log("Ref attached:", fileInputRef.current);
    if (!fileInputRef.current) {
      console.error("File input ref is null");
      return;
    }
    // Reset input value to allow re-selecting same file
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  async function handleRemovePhoto() {
    if (!confirm('Remove profile photo?')) return;

    try {
      console.log("Removing photo for student:", student?.id);
      
      if (!student?.photo_url) {
        error('No photo to remove');
        return;
      }

      // Extract filename from URL
      const urlParts = student?.photo_url?.split('/');
      const fileName = urlParts[urlParts.length - 1];
      console.log("Deleting file from storage:", fileName);

      // Delete from Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('student-photos')
        .remove([fileName]);

      if (deleteError) {
        console.log("Storage deletion error:", deleteError);
        throw deleteError;
      }
      console.log("File deleted from storage successfully");

      // Update student record to remove photo_url
      console.log("Updating database to remove photo_url");
      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: null })
        .eq('id', student.id);

      if (updateError) {
        console.log("Database update error:", updateError);
        throw updateError;
      }
      console.log("Photo URL removed from database");

      // Refresh data
      await Promise.all([mutate("students"), mutate(`student-${studentId}`)]);
      console.log("Cache refreshed, reloading page...");
      
      success('Photo removed successfully!');
      
      // Force page refresh
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 500);
    } catch (requestError) {
      console.error("Remove photo error:", requestError);
      const errorMessage = requestError instanceof Error 
        ? requestError.message 
        : typeof requestError === 'object' 
          ? JSON.stringify(requestError)
          : 'Failed to remove photo';
      error(errorMessage);
    }
  }

  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-5xl p-4 pb-16">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          {!editMode ? (
            <>
              <h1 className="text-xl font-bold text-[#FFD700]">{student.name}</h1>
              <button
                type="button"
                onClick={() => {
                  setNewName(student.name);
                  setEditMode(true);
                }}
                className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:border-[#FFD700]/40"
                aria-label="Edit Name"
              >
                ✏️
              </button>
            </>
          ) : (
            <div className="flex w-full max-w-md items-center gap-2">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-sm"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    const trimmed = newName.trim();
                    if (!trimmed) return;
                    await renameStudent(student.id, trimmed);
                    await Promise.all([mutate("students"), mutate(`student-${studentId}`)]);
                    success("Student name updated.");
                    setEditMode(false);
                  } catch (requestError) {
                    error(requestError instanceof Error ? requestError.message : "Failed to rename student.");
                  }
                }}
                className="rounded-lg bg-[#FFD700] px-3 py-2 text-xs font-semibold text-zinc-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        <TopNav />
      </header>

      <section className="card p-4">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            {student.photo_url ? (
              <>
                <img
                  src={student.photo_url}
                  alt={student.name}
                  className="w-20 h-20 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
                  onClick={handlePhotoClick}
                />
                {/* Remove photo button */}
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition font-bold text-sm"
                  title="Remove photo"
                >
                  ×
                </button>
                {/* Change overlay */}
                <div 
                  onClick={handlePhotoClick}
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs transition-opacity cursor-pointer"
                >
                  {photoUploading ? 'Uploading...' : '📷 Change'}
                </div>
              </>
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold cursor-pointer hover:bg-zinc-700 transition"
                onClick={handlePhotoClick}
              >
                {student.name.charAt(0)}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={photoUploading}
            />
          </div>
          <div>
            <TierBadge tier={student.tier} />
            <p className="mt-2 text-sm text-zinc-300">Code: {student.student_code}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <ScoreCell label="Weekly" value={student.weekly_points} />
          <ScoreCell label="Monthly" value={student.monthly_points} />
          <ScoreCell label="All Time" value={student.all_time_points} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await markStudentSession(student);
                await Promise.all([mutate("students"), mutate(`student-${studentId}`), mutate(`logs-${studentId}`), mutate("logs")]);
                success("Session marked.");
              } catch (requestError) {
                error(requestError instanceof Error ? requestError.message : "Failed to mark session.");
              }
            }}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-sm hover:border-[#FFD700]/40"
          >
            ➕ Mark Session
          </button>
          <p className="text-sm text-zinc-300">Sessions Attended: {student.sessions_attended}</p>
        </div>
      </section>



      <section className="mt-4 card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Quick Actions</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCustomOpen(true)}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:border-[#FFD700]/40"
            >
              + Custom Points
            </button>
            <button
              type="button"
              onClick={() => setDrawOpen(true)}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:border-[#FFD700]/40"
            >
              Unforced Draw
            </button>
          </div>
        </div>
        {(["MATCH", "BEHAVIOR", "GROWTH"] as const).map((category) => (
          <div key={category} className="mb-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-zinc-400">{category}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map((action) => (
                <ActionButton
                  key={action.actionType}
                  label={action.label}
                  points={action.points}
                  disabled={loadingAction === action.actionType}
                  onClick={() => runAction(action.actionType, action.points)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <TagManager
        tags={student.tags ?? []}
        onAddTag={async (tag) => {
          try {
            await addTagToStudent(student.id, tag);
            await Promise.all([mutate("students"), mutate(`student-${studentId}`)]);
            success("Tag added.");
          } catch (requestError) {
            error(requestError instanceof Error ? requestError.message : "Failed to add tag.");
          }
        }}
        onRemoveTag={async (tag) => {
          try {
            await removeTagFromStudent(student.id, tag);
            await Promise.all([mutate("students"), mutate(`student-${studentId}`)]);
            success("Tag removed.");
          } catch (requestError) {
            error(requestError instanceof Error ? requestError.message : "Failed to remove tag.");
          }
        }}
      />

      <section className="mt-4 card p-4">
        <h3 className="font-semibold text-rose-400">Danger Zone</h3>
        <button
          type="button"
          onClick={async () => {
            const confirmed = window.confirm("Are you sure? This cannot be undone.");
            if (!confirmed) return;
            try {
              await deleteStudent(student.id);
              await Promise.all([mutate("students"), mutate("logs")]);
              success("Student deleted.");
              router.push("/dashboard");
            } catch (requestError) {
              error(requestError instanceof Error ? requestError.message : "Failed to delete student.");
            }
          }}
          className="mt-3 rounded-xl border border-rose-600/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300 hover:bg-rose-900/40"
        >
          🗑 Delete Student
        </button>
      </section>

      <section className="mt-4 card p-4">
        <h3 className="font-semibold">History</h3>
        <div className="mt-3 grid max-h-80 gap-2 overflow-auto">
          {profileLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-zinc-800 p-3 text-sm">
              <p className="text-zinc-200">{formatActionType(log.action_type)}</p>
              <p className={`text-xs ${log.points >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {log.points > 0 ? "+" : ""}
                {log.points} pts
              </p>
              <p className="text-xs text-zinc-500">{new Date(log.created_at).toLocaleString()}</p>
            </article>
          ))}
          {profileLogs.length === 0 ? <p className="text-sm text-zinc-400">No history yet.</p> : null}
        </div>
      </section>

      <AttendanceHistory
        attendanceDates={student.attendance_dates}
        sessionsAttended={student.sessions_attended}
        weeklySessionsAttended={student.weekly_sessions_attended}
      />

      <ScoreModal
        students={students}
        open={drawOpen}
        onClose={() => setDrawOpen(false)}
        onConfirm={async (first, second) => {
          try {
            await applyUnforcedDraw(first, second);
            await Promise.all([mutate("students"), mutate(`student-${studentId}`), mutate(`logs-${studentId}`), mutate("logs")]);
            setDrawOpen(false);
            success("Unforced draw applied to both students.");
          } catch (requestError) {
            error(requestError instanceof Error ? requestError.message : "Failed to apply draw action.");
          }
        }}
      />
      {customOpen ? (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111111] p-4">
            <p className="text-lg font-semibold text-zinc-100">Custom Points</p>
            <p className="mt-1 text-sm text-zinc-400">Add or subtract manual points with a note.</p>
            <div className="mt-4 grid gap-3">
              <input
                type="number"
                value={customPoints}
                onChange={(event) => setCustomPoints(event.target.value)}
                placeholder="Points (+/-)"
                className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
              />
              <input
                value={customNote}
                onChange={(event) => setCustomNote(event.target.value)}
                placeholder="Note (optional)"
                className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomOpen(false);
                  setCustomPoints("0");
                  setCustomNote("");
                }}
                className="rounded-xl border border-zinc-700 p-3 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={customSubmitting}
                onClick={async () => {
                  const parsedPoints = Number(customPoints);
                  if (Number.isNaN(parsedPoints)) {
                    error("Points must be a valid number.");
                    return;
                  }
                  try {
                    setCustomSubmitting(true);
                    await applyCustomPoints(student, parsedPoints, customNote);
                    await Promise.all([mutate("students"), mutate(`student-${studentId}`), mutate(`logs-${studentId}`), mutate("logs")]);
                    setCustomOpen(false);
                    setCustomPoints("0");
                    setCustomNote("");
                    success("Custom points applied.");
                  } catch (requestError) {
                    error(requestError instanceof Error ? requestError.message : "Failed to apply custom points.");
                  } finally {
                    setCustomSubmitting(false);
                  }
                }}
                className="rounded-xl bg-[#FFD700] p-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
              >
                {customSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </main>
    </AdminGate>
  );
}

function ScoreCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function AttendanceHistory({
  attendanceDates,
  sessionsAttended,
  weeklySessionsAttended,
}: {
  attendanceDates: string[];
  sessionsAttended: number;
  weeklySessionsAttended: number;
}) {
  const [showAll, setShowAll] = useState(false);

  const sortedDates = useMemo(() => {
    return [...attendanceDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [attendanceDates]);

  const visibleDates = showAll ? sortedDates : sortedDates.slice(0, 5);

  return (
    <section className="mt-4 card p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold">📅 Attendance History</h3>
        <span className="group relative">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-600 text-[10px] text-zinc-400 cursor-help">?</span>
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 z-10">
            Attendance is auto-tracked when you mark Present or Add Session
          </span>
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-400">Total Sessions</p>
          <p className="text-lg font-semibold">{sessionsAttended}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-400">This Week</p>
          <p className="text-lg font-semibold">{weeklySessionsAttended} <span className="text-xs text-zinc-400 font-normal">sessions</span></p>
        </div>
      </div>

      {/* Date List */}
      <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wide">Attendance Dates</p>
      {sortedDates.length === 0 ? (
        <p className="text-sm text-zinc-400">No attendance recorded yet.</p>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          {visibleDates.map((date, index) => (
            <div
              key={date + index}
              className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                index !== visibleDates.length - 1 ? "border-b border-zinc-800" : ""
              }`}
            >
              <span className="text-zinc-200">
                {new Date(date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
            </div>
          ))}
        </div>
      )}

      {/* Show All / Show Less Toggle */}
      {sortedDates.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="mt-3 w-full rounded-xl border border-zinc-700 py-2 text-sm text-zinc-300 transition hover:border-[#FFD700]/40"
        >
          {showAll ? `Show Less ↑` : `Show All Dates (${sortedDates.length}) ↓`}
        </button>
      )}
    </section>
  );
}
