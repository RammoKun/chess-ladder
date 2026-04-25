import { Tier } from "@/types";

const tierStyle: Record<Tier, string> = {
  Pawn: "bg-zinc-700 text-zinc-200",
  Knight: "bg-sky-700 text-sky-100",
  Bishop: "bg-emerald-700 text-emerald-100",
  Rook: "bg-violet-700 text-violet-100",
  Queen: "bg-amber-500 text-zinc-900",
  King: "bg-[#FFD700] text-zinc-900",
};

export function TierBadge({ tier }: { tier: Tier }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tierStyle[tier]}`}>{tier}</span>;
}
