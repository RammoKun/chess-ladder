import { Student } from "@/types";
import { getTierFromScore } from "@/utils/tier";

export interface ScorePreview {
  weekly_points: number;
  monthly_points: number;
  all_time_points: number;
  tier: Student["tier"];
}

export function getUpdatedScores(student: Student, delta: number): ScorePreview {
  const allTimeScore = student.all_time_points + delta;
  return {
    weekly_points: student.weekly_points + delta,
    monthly_points: student.monthly_points + delta,
    all_time_points: allTimeScore,
    tier: getTierFromScore(allTimeScore),
  };
}
