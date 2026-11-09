import { describe, expect, it } from "vitest";

import { safetySpecVersion } from "./index";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

describe("safetySpecVersion", () => {
  it("is a semantic version string", () => {
    expect(safetySpecVersion).toMatch(SEMVER);
  });

  it("does not claim the clinically signed 1.0 spec in Faz K", () => {
    const match = SEMVER.exec(safetySpecVersion);
    expect(match).not.toBeNull();
    const major = Number(match?.[1]);
    const prerelease = match?.[4];
    expect(major).toBe(0);
    expect(prerelease).toBeTruthy();
  });
});
