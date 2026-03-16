/**
 * Format a points value for display.
 */
export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k pts`;
  }
  return `${points} pts`;
}
