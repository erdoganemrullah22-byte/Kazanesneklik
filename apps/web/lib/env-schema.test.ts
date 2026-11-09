import { describe, expect, it } from "vitest";

import { createServerEnv, type ServerEnvSource } from "./env-schema";

const valid: ServerEnvSource = {
  DATABASE_URL: "postgresql://kazan@localhost:54329/kazan",
  BETTER_AUTH_SECRET: "test-only-secret-value-0123456789abcdef",
  BETTER_AUTH_URL: "http://localhost:3000",
  AUTH_ALLOWED_EMAILS: " Sahip@Example.com , ",
};

describe("createServerEnv", () => {
  it("parses a valid environment and applies defaults", () => {
    const env = createServerEnv(valid);
    expect(env.AUTH_ALLOWED_EMAILS).toEqual(["sahip@example.com"]);
    expect(env.AI_MODEL_MAIN).toBe("claude-opus-5-5");
    expect(env.AI_LIVE).toBe(false);
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it("treats empty strings as unset", () => {
    const env = createServerEnv({ ...valid, ANTHROPIC_API_KEY: "", AI_MODEL_MAIN: "", AUTH_ALLOWED_EMAILS: "" });
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.AI_MODEL_MAIN).toBe("claude-opus-5-5");
    expect(env.AUTH_ALLOWED_EMAILS).toEqual([]);
  });

  it('parses AI_LIVE strictly ("true" / "false")', () => {
    expect(createServerEnv({ ...valid, AI_LIVE: "true" }).AI_LIVE).toBe(true);
    expect(() => createServerEnv({ ...valid, AI_LIVE: "yes" })).toThrow(/AI_LIVE/);
  });

  it.each<[keyof ServerEnvSource, string | undefined]>([
    ["DATABASE_URL", undefined],
    ["DATABASE_URL", "mysql://x@y/z"],
    ["BETTER_AUTH_SECRET", "too-short"],
    ["BETTER_AUTH_URL", "not a url"],
    ["AUTH_ALLOWED_EMAILS", "sahip@example.com,yanlis-adres"],
    ["ANTHROPIC_API_KEY", "not-an-anthropic-key"],
  ])("rejects an invalid %s", (key, value) => {
    expect(() => createServerEnv({ ...valid, [key]: value })).toThrow(new RegExp(key));
  });

  it("never echoes variable values in the error message", () => {
    const secret = "sk-ant-THIS-SHOULD-NOT-APPEAR";
    let message = "";
    try {
      createServerEnv({ ...valid, ANTHROPIC_API_KEY: secret, BETTER_AUTH_SECRET: "short" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/BETTER_AUTH_SECRET/);
    expect(message).not.toContain(secret);
    expect(message).not.toContain("short");
  });
});
