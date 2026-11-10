import "server-only";

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@kazan/contracts";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { isEmailAllowed } from "@/lib/allowlist";
import { env } from "@/lib/env";
import { requestOrigin } from "@/lib/request-origin";
import { type SignUpRejection, signUpRejection } from "@/lib/signup-policy";

import { prisma } from "./db";
import { ensureProfileForUser } from "./queries/profile";
import { findUserEmailById } from "./queries/users";

/** Error code returned when an e-mail is not on `AUTH_ALLOWED_EMAILS`. */
export const EMAIL_NOT_ALLOWED = "EMAIL_NOT_ALLOWED";

/** Error code returned while the sign-up window is closed (`AUTH_SIGNUP_OPEN`). */
export const SIGNUP_CLOSED = "SIGNUP_CLOSED";

const allowlist = new Set(env.AUTH_ALLOWED_EMAILS);
const signUpPolicy = { open: env.AUTH_SIGNUP_OPEN, allowlist };

function notAllowedError() {
  return new APIError("FORBIDDEN", {
    code: EMAIL_NOT_ALLOWED,
    message: "Bu e-posta adresiyle kayıt açık değil.",
  });
}

function signUpError(rejection: SignUpRejection) {
  if (rejection === "EMAIL_NOT_ALLOWED") return notAllowedError();
  return new APIError("FORBIDDEN", { code: SIGNUP_CLOSED, message: "Kayıt şu anda kapalı." });
}

/**
 * Better Auth (plan 10.2, Faz K 11.0): e-mail + password, sign-up and sign-in
 * only for allowlisted e-mails (`AUTH_ALLOWED_EMAILS`; env validation caps the
 * list at one address in Faz K). The allowlist compares text only and there is
 * no e-mail verification, so sign-up is additionally closed unless
 * `AUTH_SIGNUP_OPEN=true` (the owner opens it briefly for the first
 * registration). Enforced server-side in four places:
 *  1. `emailAndPassword.disableSignUp` while the window is closed,
 *  2. `hooks.before` rejects /sign-up/email and /sign-in/email early,
 *  3. `databaseHooks.user.create.before` blocks any user creation path,
 *  4. `databaseHooks.session.create.before` blocks sessions for users whose
 *     e-mail was removed from the list (and `requireUser()` re-checks on every
 *     protected request).
 */
export const auth = betterAuth({
  appName: "Kazan Esneklik",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origins = [new URL(env.BETTER_AUTH_URL).origin];
    // Cloud-session preview only (AUTH_TRUST_REQUEST_HOST, see lib/request-origin.ts).
    if (env.AUTH_TRUST_REQUEST_HOST && request) {
      const own = requestOrigin(request.headers);
      if (own) origins.push(own);
    }
    return origins;
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
    requireEmailVerification: false,
    disableSignUp: !env.AUTH_SIGNUP_OPEN,
  },
  session: {
    // Plan 10.13: database session, 30-day sliding expiry.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    // Built-in limiter: on in every environment (default would be production
    // only). Stored in Postgres because serverless instances do not share
    // memory. Sign-in/sign-up keep Better Auth's stricter default rule.
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
  },
  advanced: {
    // Ids come from the database (`@default(uuid(7))`, plan 10.4).
    database: { generateId: false },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email" && ctx.path !== "/sign-in/email") return;
      const email: unknown = (ctx.body as { email?: unknown } | undefined)?.email;
      if (ctx.path === "/sign-up/email") {
        const rejection = signUpRejection(email, signUpPolicy);
        if (rejection) throw signUpError(rejection);
        return;
      }
      if (isEmailAllowed(email, allowlist)) return;
      // Sign-in: answer exactly like a wrong password to reveal nothing.
      throw new APIError("UNAUTHORIZED", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      });
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const rejection = signUpRejection(user.email, signUpPolicy);
          if (rejection) throw signUpError(rejection);
          return { data: user };
        },
        after: async (user) => {
          await ensureProfileForUser(user.id, user.name || null);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const email = await findUserEmailById(session.userId);
          if (!isEmailAllowed(email, allowlist)) throw notAllowedError();
          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
