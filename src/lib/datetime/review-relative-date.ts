export function formatReviewRelativeDate(
  iso: string | null | undefined,
): string {
  if (!iso) return "";

  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}m`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}h`;
  }

  if (diffMs < weekMs) {
    const days = Math.max(1, Math.floor(diffMs / dayMs));
    return `${days}d`;
  }

  if (diffMs < 4 * weekMs) {
    const weeks = Math.max(1, Math.floor(diffMs / weekMs));
    return `${weeks}w`;
  }

  const date = new Date(iso);
  const now = new Date();
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}
