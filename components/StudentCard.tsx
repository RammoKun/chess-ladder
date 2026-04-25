import Link from "next/link";
import { TierBadge } from "@/components/TierBadge";
import { Student } from "@/types";

export function StudentCard({ student }: { student: Student }) {
  return (
    <Link
      href={`/students/${student.id}`}
      className="rounded-2xl border border-zinc-800 bg-[#111111] p-4 transition hover:scale-[1.01] hover:border-[#FFD700]/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {student.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photo_url} alt={student.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-semibold">{student.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-100">{student.name}</p>
          <p className="text-xs text-zinc-400">Code: {student.student_code}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <TierBadge tier={student.tier} />
        <p className="text-sm font-semibold text-[#FFD700]">{student.all_time_points} pts</p>
      </div>
      {(student.tags ?? []).length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {(student.tags ?? []).slice(0, 3).map((tag) => (
            <span key={`${student.id}-${tag}`} className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
