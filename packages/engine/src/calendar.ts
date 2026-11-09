/**
 * Calendar helpers. The engine receives dates as parameters (plan 10.3: no
 * `Date.now()`); a "local date" is the user's calendar day as `YYYY-MM-DD`,
 * already resolved in the user's time zone by the caller.
 */
const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface IsoWeek {
  /** ISO week-numbering year (may differ from the calendar year). */
  year: number;
  /** 1–53 */
  week: number;
}

function parseLocalDate(localDate: string): { year: number; month: number; day: number } {
  const match = LOCAL_DATE.exec(localDate);
  if (!match) {
    throw new RangeError(`expected YYYY-MM-DD, received "${localDate}"`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new RangeError(`not a calendar date: "${localDate}"`);
  }
  return { year, month, day };
}

/** ISO 8601 week (weeks start on Monday; week 1 contains the first Thursday). */
export function isoWeek(localDate: string): IsoWeek {
  const { year, month, day } = parseLocalDate(localDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay() || 7; // Monday = 1 … Sunday = 7
  date.setUTCDate(date.getUTCDate() + 4 - weekday); // Thursday of this week
  const isoYear = date.getUTCFullYear();
  const yearStart = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((date.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return { year: isoYear, week };
}

/** Stable key for weekly aggregates, e.g. `2026-W46`. */
export function isoWeekKey(localDate: string): string {
  const { year, week } = isoWeek(localDate);
  return `${year}-W${String(week).padStart(2, "0")}`;
}
