import { describe, expect, it } from "vitest";

import { AI_ROLES, DEFAULT_MODEL_MAIN, effortFor, resolveAiConfig } from "./config";

describe("resolveAiConfig", () => {
  it("defaults to claude-opus-5-5", () => {
    expect(DEFAULT_MODEL_MAIN).toBe("claude-opus-5-5");
    expect(resolveAiConfig().modelMain).toBe("claude-opus-5-5");
    expect(resolveAiConfig({ modelMain: "  " }).modelMain).toBe("claude-opus-5-5");
  });

  it("accepts an explicit model", () => {
    expect(resolveAiConfig({ modelMain: "claude-opus-5" }).modelMain).toBe("claude-opus-5");
  });

  it("has an explicit effort for every role (plan 8.10)", () => {
    const config = resolveAiConfig();
    expect(Object.fromEntries(AI_ROLES.map((role) => [role, effortFor(role, config)]))).toEqual({
      ANALYZE: "medium",
      EXPLAIN: "low",
      CHECKIN: "low",
      CHAT: "medium",
    });
  });
});
