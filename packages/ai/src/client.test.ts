import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AiNotConfiguredError, getAnthropicClient, resetAnthropicClientForTests } from "./client";

describe("getAnthropicClient", () => {
  beforeEach(() => {
    resetAnthropicClientForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetAnthropicClientForTests();
  });

  it("fails with a clear error when ANTHROPIC_API_KEY is missing", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(() => getAnthropicClient()).toThrow(AiNotConfiguredError);
    expect(() => getAnthropicClient()).toThrow(/ANTHROPIC_API_KEY tanımlı değil/);
  });

  it("creates a single SDK client when a key is present (no network call)", () => {
    // A placeholder that is obviously not a real key; no request is made.
    vi.stubEnv("ANTHROPIC_API_KEY", "test-placeholder-not-a-real-key");
    const first = getAnthropicClient();
    expect(first).toBeInstanceOf(Anthropic);
    expect(getAnthropicClient()).toBe(first);
  });
});
