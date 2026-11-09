import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isEmailAllowed } from "@/lib/allowlist";
import { env } from "@/lib/env";

import { type AuthSession, auth } from "./auth";

const allowlist = new Set(env.AUTH_ALLOWED_EMAILS);

/** Current session (deduplicated per request), or null. */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Session of an allowlisted user, or null. */
export async function getAllowedSession(): Promise<AuthSession | null> {
  const session = await getSession();
  if (!session || !isEmailAllowed(session.user.email, allowlist)) return null;
  return session;
}

/**
 * Page-level guard for protected routes. `proxy.ts` already redirects
 * requests without a session cookie; this verifies the session itself.
 */
export async function requireUser(): Promise<AuthSession["user"]> {
  const session = await getAllowedSession();
  if (!session) redirect("/giris");
  return session.user;
}
