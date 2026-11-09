import "server-only";

/**
 * @kazan/ai — server-only AI layer (plan 8, 10.3). Client components must not
 * import this package; the `server-only` import turns that into a build error.
 *
 * K0: client factory, model/effort configuration and the first-live-test
 * smoke call. Prompts, schemas, tools, guards (L0–L7), quotas and the circuit
 * breaker arrive in K5.
 */
export { AiNotConfiguredError, getAnthropicClient } from "./client";
export { AI_ROLES, DEFAULT_EFFORT_BY_ROLE, DEFAULT_MODEL_MAIN, effortFor, resolveAiConfig } from "./config";
export type { AiConfig, AiRole, Effort } from "./config";
export { classifyAiError } from "./errors";
export type { AiErrorCode } from "./errors";
export { SERVER_SIDE_FALLBACK_BETA, buildSmokeRequest, runAiSmoke } from "./smoke";
export type { SmokeClient, SmokeErrorCode, SmokeResult } from "./smoke";
