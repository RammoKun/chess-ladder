"use client";

import { useMemo, useState } from "react";
import { Student } from "@/types";

interface ScoreModalProps {
  students: Student[];
  open: boolean;
  onClose: () => void;
  onConfirm: (first: Student, second: Student) => Promise<void>;
}

export function ScoreModal({ students, open, onClose, onConfirm }: ScoreModalProps) {
  const [firstId, setFirstId] = useState("");
  const [secondId, setSecondId] = useState("");
  const [loading, setLoading] = useState(false);

  const first = useMemo(() => students.find((student) => student.id === firstId), [students, firstId]);
  const second = useMemo(() => students.find((student) => student.id === secondId), [students, secondId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111111] p-4">
        <p className="text-lg font-semibold text-zinc-100">Unforced Draw (-3 both)</p>
        <p className="mt-1 text-sm text-zinc-400">Select both students and apply instantly.</p>
        <div className="mt-4 grid gap-3">
          <select
            value={firstId}
            onChange={(event) => setFirstId(event.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
          >
            <option value="">Select student 1</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          <select
            value={secondId}
            onChange={(event) => setSecondId(event.target.value)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm"
          >
            <option value="">Select student 2</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-zinc-700 p-3 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={!first || !second || first.id === second.id || loading}
            onClick={async () => {
              if (!first || !second || first.id === second.id) return;
              setLoading(true);
              await onConfirm(first, second);
              setLoading(false);
              setFirstId("");
              setSecondId("");
            }}
            className="rounded-xl bg-[#FFD700] p-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
          >
            {loading ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
