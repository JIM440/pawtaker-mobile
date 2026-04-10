import {
  formatCompactDate,
  formatCompactTime,
} from "@/src/lib/datetime/request-date-time-format";

/**
 * Format a date string or Date object for display.
 * Uses Intl.DateTimeFormat for locale-aware formatting.
 */
export function formatDate(date: string | Date, locale = 'en-CA'): string {
  void locale;
  return formatCompactDate(date, "always");
}

export function formatDateTime(date: string | Date, locale = 'en-CA'): string {
  void locale;
  return `${formatCompactDate(date, "always")} ${formatCompactTime(date)}`;
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${Math.max(diffMonths, 1)}mo`;
  return `${Math.max(Math.floor(diffDays / 365), 1)}y`;
}
