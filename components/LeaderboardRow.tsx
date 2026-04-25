import Link from "next/link";
import { TierBadge } from "@/components/TierBadge";
import { Student } from "@/types";

interface LeaderboardRowProps {
  student: Student;
  rank: number;
  score: number;
  trend: number;
  adjustedLabel?: string;
  showTags?: boolean;
}

function rankGlow(rank: number) {
  if (rank === 1) return "border-[#FFD700]/80";
  if (rank === 2) return "border-zinc-300/60";
  if (rank === 3) return "border-amber-700/70";
  return "border-zinc-800";
}

export function LeaderboardRow({ student, rank, score, trend, adjustedLabel, showTags }: LeaderboardRowProps) {
  return (
    <Link href={`/students/${student.id}`} className={`block rounded-2xl border bg-[#111111] p-4 hover:border-[#FFD700]/40 transition ${rankGlow(rank)}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-bold text-[#FFD700]">#{rank}</p>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {student.photo_url ? (
              <img src={student.photo_url} className="w-10 h-10 rounded-full object-cover" alt={student.name} />
            ) : (
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="truncate font-semibold text-zinc-100">{student.name}</p>
              <TierBadge tier={student.tier} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-zinc-100">{score} pts</p>
          {adjustedLabel ? <p className="text-xs text-zinc-400">{adjustedLabel}</p> : null}
          <p className={`text-xs ${trend >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend >= 0 ? "+" : ""}
            {trend} trend
          </p>
        </div>
      </div>
      {showTags ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {(student.tags ?? []).map((tag) => (
            <span key={`${student.id}-${tag}`} className="rounded-full border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
