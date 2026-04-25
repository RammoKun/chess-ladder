export function calculateAdjustedScore(points: number, sessions: number) {
  if (sessions <= 0) return points;
  return points / sessions;
}

export function formatAdjustedScore(points: number, sessions: number) {
  if (sessions <= 0) return "0 avg";
  return `${calculateAdjustedScore(points, sessions).toFixed(2)} avg`;
}
