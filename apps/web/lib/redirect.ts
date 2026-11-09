/** Routes that require a signed-in user (plan 7.2, Faz K subset). */
export const PROTECTED_PREFIXES = ["/bugun", "/program", "/ilerleme", "/koc", "/profil"] as const;

export const DEFAULT_AFTER_SIGN_IN = "/bugun";

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Accepts a post-login redirect target only if it is one of our protected
 * in-app paths. Everything else (absolute URLs, `//host`, backslashes,
 * unknown paths) falls back to the default, which prevents open redirects.
 */
export function safeRedirectPath(target: string | null | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.includes("\\")) {
    return DEFAULT_AFTER_SIGN_IN;
  }
  let pathname: string;
  try {
    const url = new URL(target, "https://kazan.invalid");
    if (url.origin !== "https://kazan.invalid") return DEFAULT_AFTER_SIGN_IN;
    pathname = url.pathname;
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
  return isProtectedPath(pathname) ? pathname : DEFAULT_AFTER_SIGN_IN;
}
