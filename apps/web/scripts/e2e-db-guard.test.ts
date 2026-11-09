import { describe, expect, it } from "vitest";

import { assertE2eDatabaseUrl, checkE2eDatabaseUrl, isCiEnvironment } from "./e2e-db-guard.mjs";

describe("E2E database guard", () => {
  it("accepts the local throwaway database", () => {
    expect(checkE2eDatabaseUrl("postgresql://kazan@localhost:54329/kazan_e2e")).toBeNull();
    expect(checkE2eDatabaseUrl("postgres://kazan:kazan@127.0.0.1:5432/kazan_e2e")).toBeNull();
  });

  it("refuses a database whose name does not end with _e2e, even in CI", () => {
    expect(checkE2eDatabaseUrl("postgresql://kazan@localhost:54329/kazan")).toMatch(/_e2e/);
    expect(checkE2eDatabaseUrl("postgresql://kazan@localhost:5432/neondb", { ci: true })).toMatch(/_e2e/);
  });

  it("refuses a remote host outside CI and never echoes credentials", () => {
    const problem = checkE2eDatabaseUrl("postgresql://sahip:cok-gizli@ep-ornek.neon.tech/kazan_e2e?sslmode=require");
    expect(problem).toMatch(/yalnızca yerel/);
    expect(problem).toContain("ep-ornek.neon.tech/kazan_e2e");
    expect(problem).not.toContain("cok-gizli");
    expect(problem).not.toContain("sahip");
  });

  it("allows a non-local host only in CI (service container)", () => {
    expect(checkE2eDatabaseUrl("postgresql://kazan:kazan@postgres:5432/kazan_e2e", { ci: true })).toBeNull();
  });

  it("refuses missing or malformed URLs", () => {
    expect(checkE2eDatabaseUrl(undefined)).toMatch(/tanımlı değil/);
    expect(checkE2eDatabaseUrl("not a url")).toMatch(/geçerli/);
    expect(checkE2eDatabaseUrl("mysql://localhost/kazan_e2e")).toMatch(/postgresql/);
  });

  it("assertE2eDatabaseUrl throws with the reason", () => {
    expect(() => assertE2eDatabaseUrl("postgresql://kazan@localhost:54329/kazan")).toThrow(/E2E durduruldu/);
  });

  it("reads CI like GitHub Actions sets it", () => {
    expect(isCiEnvironment({ CI: "true" })).toBe(true);
    expect(isCiEnvironment({ CI: "false" })).toBe(false);
    expect(isCiEnvironment({})).toBe(false);
  });
});
