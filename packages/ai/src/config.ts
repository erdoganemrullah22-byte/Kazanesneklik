import type Anthropic from "@anthropic-ai/sdk";

/** Default model for every role (plan 8.10). */
export const DEFAULT_MODEL_MAIN = "claude-opus-5-5";

export type Effort = NonNullable<Anthropic.Beta.BetaOutputConfig["effort"]>;

/** AI roles (plan 8.2): A1 analyze, A2 explain, A3 check-in, A4 chat. */
export const AI_ROLES = ["ANALYZE", "EXPLAIN", "CHECKIN", "CHAT"] as const;
export type AiRole = (typeof AI_ROLES)[number];

/**
 * Effort per role (plan 8.10: effort is written explicitly on every call;
 * thinking cannot be disabled on Opus 5.5, effort is the only depth control).
 */
export const DEFAULT_EFFORT_BY_ROLE: Readonly<Record<AiRole, Effort>> = Object.freeze({
  ANALYZE: "medium",
  EXPLAIN: "low",
  CHECKIN: "low",
  CHAT: "medium",
});

export interface AiConfig {
  modelMain: string;
  effortByRole: Readonly<Record<AiRole, Effort>>;
}

export interface AiConfigInput {
  modelMain?: string | undefined;
}

export function resolveAiConfig(input: AiConfigInput = {}): AiConfig {
  const modelMain = input.modelMain?.trim();
  return {
    modelMain: modelMain && modelMain.length > 0 ? modelMain : DEFAULT_MODEL_MAIN,
    effortByRole: DEFAULT_EFFORT_BY_ROLE,
  };
}

export function effortFor(role: AiRole, config: AiConfig): Effort {
  return config.effortByRole[role];
}
