import "server-only";

import { type AiSmokeResponse } from "@kazan/contracts";
import { AiNotConfiguredError, getAnthropicClient, resolveAiConfig, runAiSmoke } from "@kazan/ai";

import { env } from "@/lib/env";

/** Runs the smoke call with the server's configuration. */
export async function runSmokeForServer(): Promise<AiSmokeResponse> {
  const { modelMain } = resolveAiConfig({ modelMain: env.AI_MODEL_MAIN });
  let client;
  try {
    client = getAnthropicClient();
  } catch (error) {
    if (error instanceof AiNotConfiguredError) {
      return { ok: false, model: modelMain, stop_reason: null, latencyMs: 0, error: "NOT_CONFIGURED" };
    }
    throw error;
  }
  return runAiSmoke(client, { model: modelMain });
}
