import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";

import { SERVER_SIDE_FALLBACK_BETA, buildSmokeRequest, runAiSmoke, type SmokeClient } from "./smoke";

type BetaMessage = Anthropic.Beta.Messages.BetaMessage;

/** Builds a minimal BetaMessage-shaped response for the mock client. */
function message(overrides: Partial<BetaMessage>): BetaMessage {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [],
    stop_reason: "end_turn",
    stop_details: null,
    ...overrides,
  } as unknown as BetaMessage;
}

function mockClient(impl: () => Promise<BetaMessage>) {
  const create = vi.fn(impl);
  const client: SmokeClient = { beta: { messages: { create } } };
  return { client, create };
}

/** Clock that advances 42 ms between calls. */
function steppingClock() {
  let t = 1_000;
  return () => {
    const value = t;
    t += 42;
    return value;
  };
}

describe("buildSmokeRequest", () => {
  const body = buildSmokeRequest("claude-opus-5-5") as unknown as Record<string, unknown>;

  it("sets effort explicitly and opts into server-side fallbacks", () => {
    expect(body).toMatchObject({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      betas: [SERVER_SIDE_FALLBACK_BETA],
      fallbacks: "default",
    });
  });

  it("never sends sampling params, thinking config, prefill or forced tool choice", () => {
    for (const key of ["temperature", "top_p", "top_k", "thinking", "tool_choice", "tools", "system"]) {
      expect(body).not.toHaveProperty(key);
    }
    const messages = body["messages"] as Array<{ role: string }>;
    expect(messages).toHaveLength(1);
    expect(messages.at(-1)?.role).toBe("user");
  });
});

describe("runAiSmoke", () => {
  it("returns ok with model, stop_reason and latency on a normal reply", async () => {
    const { client, create } = mockClient(async () =>
      message({ content: [{ type: "text", text: "Tamam." }] as BetaMessage["content"] }),
    );
    const result = await runAiSmoke(client, { model: "claude-opus-5-5", now: steppingClock() });
    expect(result).toEqual({ ok: true, model: "claude-opus-5-5", stop_reason: "end_turn", latencyMs: 42 });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(buildSmokeRequest("claude-opus-5-5"));
  });

  it("handles a refusal before touching the content", async () => {
    const content = new Proxy([], {
      get() {
        throw new Error("content must not be read on refusal");
      },
    });
    const { client } = mockClient(async () =>
      message({
        stop_reason: "refusal",
        stop_details: {
          type: "refusal",
          category: null,
          explanation: null,
          fallback_credit_token: null,
          fallback_has_prefill_claim: null,
          recommended_model: null,
        },
        content,
      }),
    );
    const result = await runAiSmoke(client, { model: "claude-opus-5-5", now: steppingClock() });
    expect(result).toEqual({
      ok: false,
      model: "claude-opus-5-5",
      stop_reason: "refusal",
      latencyMs: 42,
      error: "REFUSAL",
    });
  });

  it("reports the model that actually served the reply (fallback)", async () => {
    const { client } = mockClient(async () =>
      message({ model: "claude-opus-5", content: [{ type: "text", text: "tamam" }] as BetaMessage["content"] }),
    );
    const result = await runAiSmoke(client, { model: "claude-opus-5-5" });
    expect(result.ok).toBe(true);
    expect(result.model).toBe("claude-opus-5");
  });

  it("flags max_tokens or empty output as unexpected", async () => {
    const { client } = mockClient(async () => message({ stop_reason: "max_tokens", content: [] }));
    const result = await runAiSmoke(client, { model: "claude-opus-5-5" });
    expect(result).toMatchObject({ ok: false, stop_reason: "max_tokens", error: "UNEXPECTED_OUTPUT" });
  });

  it.each([
    ["AUTH", () => new Anthropic.AuthenticationError(401, undefined, "invalid x-api-key", new Headers())],
    ["PERMISSION", () => new Anthropic.PermissionDeniedError(403, undefined, "forbidden", new Headers())],
    ["BAD_REQUEST", () => new Anthropic.BadRequestError(400, undefined, "bad", new Headers())],
    ["RATE_LIMITED", () => new Anthropic.RateLimitError(429, undefined, "slow down", new Headers())],
    ["TIMEOUT", () => new Anthropic.APIConnectionTimeoutError()],
    ["CONNECTION", () => new Anthropic.APIConnectionError({ message: "socket hang up" })],
    ["UPSTREAM", () => new Anthropic.InternalServerError(529, undefined, "overloaded", new Headers())],
    ["API_ERROR", () => new Anthropic.APIError(418, undefined, "teapot", new Headers())],
  ] as const)("maps SDK errors to %s without leaking details", async (code, makeError) => {
    const { client } = mockClient(async () => {
      throw makeError();
    });
    const result = await runAiSmoke(client, { model: "claude-opus-5-5", now: steppingClock() });
    expect(result).toEqual({ ok: false, model: "claude-opus-5-5", stop_reason: null, latencyMs: 42, error: code });
  });

  it("rethrows errors that are not SDK API errors", async () => {
    const { client } = mockClient(async () => {
      throw new TypeError("bug");
    });
    await expect(runAiSmoke(client, { model: "claude-opus-5-5" })).rejects.toThrow(TypeError);
  });
});
