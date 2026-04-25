export function calculateAdjustedScore(totalPoints: number, sessionsAttended: number) {
  return totalPoints / Math.max(sessionsAttended, 1);
}

export function formatAdjustedScore(totalPoints: number, sessionsAttended: number) {
  const adjusted = calculateAdjustedScore(totalPoints, sessionsAttended);
  return `Avg: ${adjusted.toFixed(1)}`;
}

const ACTION_LABELS: Record<string, string> = {
  match_beat_stronger: "Beat Stronger Player",
  match_beat_equal: "Beat Equal Player",
  match_beat_weaker: "Beat Weaker Player",
  match_lost: "Lost Match",
  match_lost_to_stronger: "Lost to Stronger Player",
  match_unforced_draw: "Unforced Draw",
  behavior_rage_quit: "Rage Quit",
  behavior_early_resign: "Early Resign",
  behavior_disturbing_class: "Disturbing Class",
  behavior_time_pass: "Time Pass / Not Playing",
  behavior_solved_puzzle: "Solved Puzzle",
  behavior_taught_others: "Taught Other Players",
  growth_played_stronger_voluntarily: "Played Stronger Voluntarily",
  custom_points: "Custom Points",
  mark_session: "Session Marked",
  attendance_mark_present: "Marked Present",
  attendance_add_session: "Added Session",
};

export function formatActionType(actionType: string): string {
  // Handle "custom_points: some note" → "Custom Points: some note" or just "some note"
  if (actionType.startsWith("custom_points:")) {
    const note = actionType.slice("custom_points:".length).trim();
    return note ? note : "Custom Points";
  }
  return ACTION_LABELS[actionType] || actionType;
}
