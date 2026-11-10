import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { FAZ_K_MAX_ALLOWED_EMAILS, parseAllowedEmails } from "./allowlist";

/**
 * Server environment schema (plan 10.2, 10.14). Values are never logged.
 *
 * This module has no `server-only` marker so unit tests can import it; the
 * app reads env only through `lib/env.ts`, which is server-only.
 */
const postgresUrl = z
  .url({ protocol: /^postgres(ql)?$/, error: "postgresql:// ile başlayan bir bağlantı dizesi olmalı" })
  .describe("PostgreSQL connection string (pooled in production)");

const booleanFlag = z
  .enum(["true", "false"], { error: 'yalnızca "true" ya da "false" olabilir' })
  .default("false")
  .transform((value) => value === "true");

export const serverEnvShape = {
  DATABASE_URL: postgresUrl,
  BETTER_AUTH_SECRET: z.string().min(32, "en az 32 karakter olmalı (openssl rand -base64 32)"),
  BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
  AUTH_ALLOWED_EMAILS: z
    .string()
    .default("")
    .transform((raw) => [...parseAllowedEmails(raw)])
    .pipe(
      z
        .array(z.email("izin listesinde geçersiz bir e-posta var"))
        .max(
          FAZ_K_MAX_ALLOWED_EMAILS,
          `Faz K'da en fazla ${FAZ_K_MAX_ALLOWED_EMAILS} e-posta olabilir; başka bir kişiye açmadan önce herkese açma kapısı (plan 11.0.4)`,
        ),
    ),
  /** Sign-up window (Faz K): closed unless explicitly "true". */
  AUTH_SIGNUP_OPEN: booleanFlag,
  /**
   * Cloud-session preview (Faz K): also trust the request's own origin
   * (X-Forwarded-Proto/Host, else Host) for Better Auth's origin check, so the
   * app works behind a forwarding preview whose public URL is not known in
   * advance. Still a same-origin check: a cross-site request's Origin never
   * equals the host it is sent to. Off unless explicitly "true".
   */
  AUTH_TRUST_REQUEST_HOST: booleanFlag,
  ANTHROPIC_API_KEY: z.string().startsWith("sk-ant-", "Anthropic anahtarı sk-ant- ile başlar").optional(),
  AI_MODEL_MAIN: z.string().trim().min(1).default("claude-opus-5-5"),
  AI_LIVE: booleanFlag,
} as const;

export type ServerEnvSource = Partial<Record<keyof typeof serverEnvShape, string | undefined>>;

/**
 * Always validates: there is deliberately no "skip validation" switch. With
 * t3-env's `skipValidation` the raw strings would be returned untransformed
 * (`AI_LIVE: "false"` would be truthy). Tools that do not serve requests
 * (lint, typecheck, unit tests) never import `lib/env.ts`.
 */
export function createServerEnv(source: ServerEnvSource) {
  return createEnv({
    server: serverEnvShape,
    client: {},
    runtimeEnv: {
      DATABASE_URL: source.DATABASE_URL,
      BETTER_AUTH_SECRET: source.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: source.BETTER_AUTH_URL,
      AUTH_ALLOWED_EMAILS: source.AUTH_ALLOWED_EMAILS,
      AUTH_SIGNUP_OPEN: source.AUTH_SIGNUP_OPEN,
      AUTH_TRUST_REQUEST_HOST: source.AUTH_TRUST_REQUEST_HOST,
      ANTHROPIC_API_KEY: source.ANTHROPIC_API_KEY,
      AI_MODEL_MAIN: source.AI_MODEL_MAIN,
      AI_LIVE: source.AI_LIVE,
    },
    emptyStringAsUndefined: true,
    onValidationError: (issues) => {
      const fields = issues.map((issue) => {
        const key = issue.path?.map((p) => (typeof p === "object" ? p.key : p)).join(".") ?? "?";
        return `  - ${key}: ${issue.message}`;
      });
      // Only variable names and messages; never values.
      throw new Error(`Geçersiz ortam değişkenleri:\n${fields.join("\n")}`);
    },
  });
}
