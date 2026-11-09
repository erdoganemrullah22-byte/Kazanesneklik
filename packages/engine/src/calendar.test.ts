import { describe, expect, it } from "vitest";

import { isoWeek, isoWeekKey } from "./calendar";

describe("isoWeekKey", () => {
  it.each([
    ["2026-11-09", "2026-W46"], // Monday
    ["2026-11-15", "2026-W46"], // Sunday, same week
    ["2026-01-01", "2026-W01"], // Thursday → week 1
    ["2024-12-30", "2025-W01"], // Monday belongs to the next ISO year
    ["2027-01-01", "2026-W53"], // 2026 starts on Thursday → 53 weeks
    ["2021-01-03", "2020-W53"],
  ])("%s → %s", (date, expected) => {
    expect(isoWeekKey(date)).toBe(expected);
  });

  it("returns the ISO year separately from the calendar year", () => {
    expect(isoWeek("2027-01-01")).toEqual({ year: 2026, week: 53 });
  });

  it.each(["2026-02-30", "2026-13-01", "26-11-09", "2026-11-9", ""])("rejects invalid input %j", (date) => {
    expect(() => isoWeekKey(date)).toThrow(RangeError);
  });
});
