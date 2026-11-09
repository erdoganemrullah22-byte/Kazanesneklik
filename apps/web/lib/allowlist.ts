/**
 * Sign-up / sign-in allowlist (Faz K, plan 11.0.1).
 *
 * `AUTH_ALLOWED_EMAILS` is a comma-separated list. Entries are trimmed and
 * lower-cased with the locale-independent `toLowerCase()` (never the Turkish
 * locale: "I" must stay "i" in e-mail addresses). An empty list closes
 * registration completely. The check runs on the server; hiding UI is not
 * enough.
 */
export type EmailAllowlist = ReadonlySet<string>;

/**
 * Faz K is single-user (plan 10 "Faz K farkları", risk 26): the list format is
 * general, but env validation accepts at most this many addresses. Raising it
 * is a code change (PR) on purpose: a second person may use the site only
 * after the "herkese açma kapısı" (plan 11.0.4).
 */
export const FAZ_K_MAX_ALLOWED_EMAILS = 1;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseAllowedEmails(raw: string | undefined | null): EmailAllowlist {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map(normalizeEmail)
      .filter((entry) => entry.length > 0),
  );
}

export function isEmailAllowed(email: unknown, allowlist: EmailAllowlist): boolean {
  if (typeof email !== "string" || allowlist.size === 0) return false;
  return allowlist.has(normalizeEmail(email));
}
