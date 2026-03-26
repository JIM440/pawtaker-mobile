import type { CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";

/**
 * PawTaker point rules:
 * Points for one completed agreement = durationUnits(careType) × rate(careType)
 * — Play/Walk: 1 pt × sessions (1 session per calendar day in range)
 * — Daytime: 2 pts × days (inclusive calendar days)
 * — Overnight: 4 pts × nights (max(1, inclusiveDays - 1))
 * — Vacation: 5 pts × days (inclusive calendar days)
 *
 * Ledger: taker +points (care given), owner −points (care received).
 * Net balance trend aligns with Care Given − Care Received per user over time.
 */

export function normalizeCareTypeForPoints(raw: string | null | undefined): CareTypeKey {
  const k = (raw ?? "").trim().toLowerCase();
  if (k === "walking" || k === "walk" || k === "playwalk" || k === "play_walk") {
    return "playwalk";
  }
  if (k === "boarding" || k === "overnight") return "overnight";
  if (k === "vacation" || k === "trip") return "vacation";
  if (k === "sitting" || k === "daytime" || k === "day") return "daytime";
  return "daytime";
}

export function inclusiveCalendarDayCount(startDate: string, endDate: string): number {
  const d0 = startDate.slice(0, 10);
  const d1 = endDate.slice(0, 10);
  const t0 = Date.parse(`${d0}T12:00:00.000Z`);
  const t1 = Date.parse(`${d1}T12:00:00.000Z`);
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return 1;
  const diffDays = Math.round((t1 - t0) / 86400000);
  return Math.max(1, diffDays + 1);
}

export function pointsRateForCareType(kind: CareTypeKey): number {
  switch (kind) {
    case "playwalk":
      return 1;
    case "daytime":
      return 2;
    case "overnight":
      return 4;
    case "vacation":
      return 5;
    default:
      return 2;
  }
}

export function durationUnitsForCareType(
  kind: CareTypeKey,
  startDate: string,
  endDate: string,
): number {
  const days = inclusiveCalendarDayCount(startDate, endDate);
  switch (kind) {
    case "playwalk":
      return days;
    case "daytime":
      return days;
    case "overnight":
      return Math.max(1, days - 1);
    case "vacation":
      return days;
    default:
      return days;
  }
}

export function computeCarePoints(
  careTypeRaw: string | null | undefined,
  startDate: string,
  endDate: string,
): number {
  const kind = normalizeCareTypeForPoints(careTypeRaw);
  const units = durationUnitsForCareType(kind, startDate, endDate);
  const rate = pointsRateForCareType(kind);
  return Math.max(1, units * rate);
}

export function formatCarePointsPts(
  careTypeRaw: string | null | undefined,
  startDate: string,
  endDate: string,
): string {
  return `${computeCarePoints(careTypeRaw, startDate, endDate)} pts`;
}
