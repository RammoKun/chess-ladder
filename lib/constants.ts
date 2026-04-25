import { ScoreAction, Tier } from "@/types";

export const ACTIONS: ScoreAction[] = [
  { label: "Beat weaker", actionType: "match_beat_weaker", points: 3, category: "MATCH" },
  { label: "Beat equal", actionType: "match_beat_equal", points: 8, category: "MATCH" },
  { label: "Beat stronger", actionType: "match_beat_stronger", points: 15, category: "MATCH" },
  { label: "Lost", actionType: "match_lost", points: -3, category: "MATCH" },
  {
    label: "Lost to stronger",
    actionType: "match_lost_to_stronger",
    points: 1,
    category: "MATCH",
  },
  {
    label: "Solved Puzzle",
    actionType: "behavior_solved_puzzle",
    points: 3,
    category: "BEHAVIOR",
  },
  {
    label: "Taught others",
    actionType: "behavior_taught_others",
    points: 5,
    category: "BEHAVIOR",
  },
  {
    label: "Early resign",
    actionType: "behavior_early_resign",
    points: -5,
    category: "BEHAVIOR",
  },
  {
    label: "Rage quit",
    actionType: "behavior_rage_quit",
    points: -8,
    category: "BEHAVIOR",
  },
  {
    label: "Disturbing class",
    actionType: "behavior_disturbing_class",
    points: -5,
    category: "BEHAVIOR",
  },
  { label: "Time pass", actionType: "behavior_time_pass", points: -3, category: "BEHAVIOR" },
  {
    label: "Played stronger voluntarily",
    actionType: "growth_played_stronger_voluntarily",
    points: 3,
    category: "GROWTH",
  },
];

export const TIER_ORDER: Tier[] = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];
