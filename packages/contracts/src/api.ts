import { z } from "zod";

/** `GET /api/health` — liveness + database reachability. Never carries secrets. */
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  db: z.enum(["ok", "error"]),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/**
 * `POST /api/admin/ai/smoke` — first live AI check (plan 10.14 E).
 * Only these fields leave the server: no key, headers or model output.
 */
export const aiSmokeErrorCodeSchema = z.enum([
  "AUTH",
  "PERMISSION",
  "BAD_REQUEST",
  "RATE_LIMITED",
  "TIMEOUT",
  "CONNECTION",
  "UPSTREAM",
  "API_ERROR",
  "REFUSAL",
  "UNEXPECTED_OUTPUT",
  "NOT_CONFIGURED",
]);
export type AiSmokeErrorCode = z.infer<typeof aiSmokeErrorCodeSchema>;

export const aiSmokeResponseSchema = z.object({
  ok: z.boolean(),
  model: z.string(),
  stop_reason: z.string().nullable(),
  latencyMs: z.number().int().nonnegative(),
  error: aiSmokeErrorCodeSchema.optional(),
});
export type AiSmokeResponse = z.infer<typeof aiSmokeResponseSchema>;

/** Error envelope shared by route handlers (plan 10.6). */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
