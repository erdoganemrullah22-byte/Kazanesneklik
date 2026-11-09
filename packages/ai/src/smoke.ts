import "server-only";

import type Anthropic from "@anthropic-ai/sdk";

import { type AiErrorCode, classifyAiError } from "./errors";

/** Beta flag for server-side refusal fallback (plan 8.10). */
export const SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

export type SmokeErrorCode = AiErrorCode | "REFUSAL" | "UNEXPECTED_OUTPUT";

/** Only these fields leave the server (no key, headers or model text). */
export interface SmokeResult {
  ok: boolean;
  model: string;
  stop_reason: string | null;
  latencyMs: number;
  error?: SmokeErrorCode;
}

/** The minimal client surface the smoke test needs (lets tests inject a mock). */
export interface SmokeClient {
  beta: {
    messages: {
      create(
        body: Anthropic.Beta.Messages.MessageCreateParamsNonStreaming,
      ): PromiseLike<Anthropic.Beta.Messages.BetaMessage>;
    };
  };
}

/**
 * Request body for the smoke call. Deliberately absent (plan 8.10, Opus 5.5):
 * temperature/top_p/top_k (400), `thinking` (always on; `disabled` is a 400),
 * assistant prefill, and forced `tool_choice`. Effort is set explicitly.
 */
export function buildSmokeRequest(model: string): Anthropic.Beta.Messages.MessageCreateParamsNonStreaming {
  return {
    model,
    max_tokens: 1024,
    output_config: { effort: "low" },
    betas: [SERVER_SIDE_FALLBACK_BETA],
    fallbacks: "default",
    messages: [{ role: "user", content: "Sadece 'tamam' yaz." }],
  };
}

export interface RunSmokeOptions {
  model: string;
  /** Monotonic clock in ms; injectable for tests. */
  now?: () => number;
}

export async function runAiSmoke(client: SmokeClient, { model, now = () => performance.now() }: RunSmokeOptions): Promise<SmokeResult> {
  const startedAt = now();
  const elapsed = () => Math.max(0, Math.round(now() - startedAt));

  let response: Anthropic.Beta.Messages.BetaMessage;
  try {
    response = await client.beta.messages.create(buildSmokeRequest(model));
  } catch (error) {
    const code = classifyAiError(error);
    if (code === null) throw error;
    return { ok: false, model, stop_reason: null, latencyMs: elapsed(), error: code };
  }

  const latencyMs = elapsed();

  // A refusal is checked before any content is read (plan 8.10). Even with
  // fallbacks enabled the whole chain may decline.
  if (response.stop_reason === "refusal") {
    return { ok: false, model: response.model, stop_reason: response.stop_reason, latencyMs, error: "REFUSAL" };
  }

  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  const ok = response.stop_reason === "end_turn" && text.length > 0;

  return {
    ok,
    model: response.model,
    stop_reason: response.stop_reason,
    latencyMs,
    ...(ok ? {} : { error: "UNEXPECTED_OUTPUT" as const }),
  };
}
