import { Tier } from "@/types";

export function getTierFromScore(score: number): Tier {
  if (score >= 500) return "King";
  if (score >= 350) return "Queen";
  if (score >= 200) return "Rook";
  if (score >= 100) return "Bishop";
  if (score >= 50) return "Knight";
  return "Pawn";
}
