import { describe, expect, it } from "vitest";

import {
  assertDevCommandIsLocal,
  describeDatabaseUrl,
  isDevOnlyPrismaCommand,
  isLocalDatabaseUrl,
  resolveCliDatabaseUrl,
} from "./database-url";

const LOCAL = "postgresql://kazan@localhost:54329/kazan";
const E2E = "postgresql://kazan@localhost:54329/kazan_e2e";
const PROD = "postgresql://sahip:gizli@ep-ornek.eu-central-1.aws.neon.tech/neondb?sslmode=require";

describe("resolveCliDatabaseUrl", () => {
  it("prefers DATABASE_URL_UNPOOLED, then DATABASE_URL from the process environment", () => {
    expect(resolveCliDatabaseUrl({ DATABASE_URL_UNPOOLED: PROD, DATABASE_URL: E2E })).toEqual({
      url: PROD,
      source: "env:DATABASE_URL_UNPOOLED",
    });
    expect(resolveCliDatabaseUrl({ DATABASE_URL: E2E }, { DATABASE_URL: LOCAL })).toEqual({
      url: E2E,
      source: "env:DATABASE_URL",
    });
  });

  it("never lets an UNPOOLED address in .env.local win over a DATABASE_URL given on the command line", () => {
    const resolved = resolveCliDatabaseUrl({ DATABASE_URL: E2E }, { DATABASE_URL_UNPOOLED: PROD, DATABASE_URL: LOCAL });
    expect(resolved?.url).toBe(E2E);
  });

  it("ignores DATABASE_URL_UNPOOLED from .env.local entirely", () => {
    expect(resolveCliDatabaseUrl({}, { DATABASE_URL_UNPOOLED: PROD })).toBeNull();
    expect(resolveCliDatabaseUrl({}, { DATABASE_URL_UNPOOLED: PROD, DATABASE_URL: LOCAL })).toEqual({
      url: LOCAL,
      source: "env.local:DATABASE_URL",
    });
  });

  it("treats empty values as unset", () => {
    expect(
      resolveCliDatabaseUrl({ DATABASE_URL_UNPOOLED: " ", DATABASE_URL: "" }, { DATABASE_URL: LOCAL })?.source,
    ).toBe("env.local:DATABASE_URL");
  });
});

describe("dev-only command guard", () => {
  it("recognises destructive dev commands", () => {
    expect(isDevOnlyPrismaCommand(["migrate", "dev", "--name", "init"])).toBe(true);
    expect(isDevOnlyPrismaCommand(["migrate", "reset", "--force"])).toBe(true);
    expect(isDevOnlyPrismaCommand(["db", "push"])).toBe(true);
    expect(isDevOnlyPrismaCommand(["migrate", "deploy"])).toBe(false);
    expect(isDevOnlyPrismaCommand(["generate"])).toBe(false);
  });

  it("detects local hosts", () => {
    expect(isLocalDatabaseUrl(LOCAL)).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://k@127.0.0.1:5432/kazan")).toBe(true);
    expect(isLocalDatabaseUrl(PROD)).toBe(false);
    expect(isLocalDatabaseUrl("not a url")).toBe(false);
  });

  it("refuses migrate dev against a remote database without leaking credentials", () => {
    const resolved = resolveCliDatabaseUrl({}, { DATABASE_URL: PROD });
    expect(() => assertDevCommandIsLocal(["migrate", "dev"], resolved, {})).toThrow(/yalnızca yerel/);
    try {
      assertDevCommandIsLocal(["migrate", "dev"], resolved, {});
    } catch (error) {
      expect((error as Error).message).not.toContain("gizli");
      expect((error as Error).message).toContain("ep-ornek.eu-central-1.aws.neon.tech/neondb");
    }
  });

  it("allows migrate deploy remotely, dev commands locally and the explicit escape hatch", () => {
    const remote = resolveCliDatabaseUrl({ DATABASE_URL_UNPOOLED: PROD });
    expect(() => assertDevCommandIsLocal(["migrate", "deploy"], remote, {})).not.toThrow();
    expect(() =>
      assertDevCommandIsLocal(["migrate", "dev"], resolveCliDatabaseUrl({ DATABASE_URL: LOCAL }), {}),
    ).not.toThrow();
    expect(() =>
      assertDevCommandIsLocal(["migrate", "dev"], remote, { KAZAN_ALLOW_REMOTE_DEV_COMMANDS: "1" }),
    ).not.toThrow();
    expect(() => assertDevCommandIsLocal(["migrate", "dev"], null, {})).not.toThrow();
  });

  it("describes a URL by host and database only", () => {
    expect(describeDatabaseUrl(PROD)).toBe("ep-ornek.eu-central-1.aws.neon.tech/neondb");
    expect(describeDatabaseUrl(E2E)).toBe("localhost:54329/kazan_e2e");
  });
});
