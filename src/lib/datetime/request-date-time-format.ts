type DateYearMode = "never" | "ifDifferentYear" | "always";

function parseDateValue(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short" }).replace(".", "");
}

function shouldShowYear(date: Date, mode: DateYearMode) {
  if (mode === "always") return true;
  if (mode === "never") return false;
  return date.getFullYear() !== new Date().getFullYear();
}

export function formatCompactDate(
  value?: string | Date | null,
  yearMode: DateYearMode = "ifDifferentYear",
): string {
  const date = parseDateValue(value);
  if (!date) return "";

  return `${date.getDate()}${monthShort(date)}${
    shouldShowYear(date, yearMode) ? date.getFullYear() : ""
  }`;
}

export function formatCompactTime(value?: string | Date | null): string {
  if (!value) return "";

  let hour: number;
  let minute: number;

  if (value instanceof Date) {
    hour = value.getHours();
    minute = value.getMinutes();
  } else {
    const [hRaw, mRaw] = value.slice(0, 5).split(":");
    hour = Number(hRaw);
    minute = Number(mRaw);
  }

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";

  const isPm = hour >= 12;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const minutePart =
    minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;

  return `${hour12}${minutePart}${isPm ? "pm" : "am"}`;
}

export function formatRequestDateRange(
  startDateRaw?: string | null,
  endDateRaw?: string | null,
): string {
  const start = parseDateValue(startDateRaw);
  const end = parseDateValue(endDateRaw);

  if (!start) return "";
  if (!end) return formatCompactDate(start);

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return formatCompactDate(start);

  return `${formatCompactDate(start)}-${formatCompactDate(end)}`;
}

export function formatRequestTimeRange(
  startTimeRaw?: string | null,
  endTimeRaw?: string | null,
): string {
  const start = formatCompactTime(startTimeRaw);
  const end = formatCompactTime(endTimeRaw);

  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;

  return `${start}-${end}`;
}
