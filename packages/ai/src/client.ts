import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/** Thrown when the server has no Anthropic API key configured. */
export class AiNotConfiguredError extends Error {
  override readonly name = "AiNotConfiguredError";
  constructor() {
    super(
      "ANTHROPIC_API_KEY tanımlı değil. Anahtar yalnızca barındırma ortamının gizli değişkenlerinde durur (README → Dağıtım).",
    );
  }
}

let cachedClient: Anthropic | undefined;

/**
 * Server-only Anthropic client. `new Anthropic()` reads `ANTHROPIC_API_KEY`
 * from the environment; we check for it first so a missing key fails loudly
 * instead of falling back to other credential sources on the host.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey || apiKey.trim().length === 0) {
    throw new AiNotConfiguredError();
  }
  cachedClient ??= new Anthropic();
  return cachedClient;
}

/** Test helper: forget the cached client. */
export function resetAnthropicClientForTests(): void {
  cachedClient = undefined;
}
