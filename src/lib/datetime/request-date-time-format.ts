export function formatRequestDateRange(
  startDateRaw?: string | null,
  endDateRaw?: string | null,
): string {
  if (!startDateRaw) return "";
  const start = new Date(startDateRaw);
  const end = endDateRaw ? new Date(endDateRaw) : null;
  if (Number.isNaN(start.getTime())) return "";
  if (end && Number.isNaN(end.getTime())) return "";

  const monthShort = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" });
  const day = (d: Date) => d.getDate();

  if (!end) return `${monthShort(start)} ${day(start)}`;
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  return sameMonth
    ? `${monthShort(start)} ${day(start)}-${day(end)}`
    : `${monthShort(start)} ${day(start)}-${monthShort(end)} ${day(end)}`;
}

export function formatRequestTimeRange(
  startTimeRaw?: string | null,
  endTimeRaw?: string | null,
): string {
  const toLabel = (raw?: string | null) => {
    if (!raw || typeof raw !== "string") return "";
    const hhmm = raw.slice(0, 5);
    const [hRaw, mRaw] = hhmm.split(":");
    const hour = Number(hRaw);
    const minute = Number(mRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
    const isPm = hour >= 12;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minutePart = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
    return `${hour12}${minutePart}${isPm ? "pm" : "am"}`;
  };

  const start = toLabel(startTimeRaw);
  const end = toLabel(endTimeRaw);
  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;
  return `${start}-${end}`;
}
