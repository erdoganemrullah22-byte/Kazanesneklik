import Anthropic from "@anthropic-ai/sdk";

/** Coarse, secret-free error codes that may leave the server. */
export type AiErrorCode =
  | "AUTH"
  | "PERMISSION"
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "CONNECTION"
  | "UPSTREAM"
  | "API_ERROR";

/**
 * Maps SDK errors to codes using the SDK's typed error classes, most specific
 * first. Returns `null` for anything that is not an SDK API error (a bug in
 * our code), so callers can rethrow it.
 */
export function classifyAiError(error: unknown): AiErrorCode | null {
  if (error instanceof Anthropic.AuthenticationError) return "AUTH";
  if (error instanceof Anthropic.PermissionDeniedError) return "PERMISSION";
  if (error instanceof Anthropic.BadRequestError) return "BAD_REQUEST";
  if (error instanceof Anthropic.RateLimitError) return "RATE_LIMITED";
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "TIMEOUT";
  if (error instanceof Anthropic.APIConnectionError) return "CONNECTION";
  if (error instanceof Anthropic.InternalServerError) return "UPSTREAM";
  if (error instanceof Anthropic.APIError) return "API_ERROR";
  return null;
}
