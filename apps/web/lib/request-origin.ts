/**
 * Origin of the host that is serving this request, as the browser sees it.
 *
 * Used only when `AUTH_TRUST_REQUEST_HOST=true` (cloud-session preview, Faz K):
 * the app then sits behind a forwarding proxy whose public URL is not known in
 * advance, so Better Auth's origin check also trusts "the origin of the host
 * this request was sent to". That is still a same-origin check: a cross-site
 * request carries the attacker's Origin, which never equals our own host.
 *
 * Returns `null` for anything that is not a plain http(s) origin.
 */
export function requestOrigin(headers: Headers): string | null {
  const host = firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));
  if (!host) return null;

  const forwardedProto = firstValue(headers.get("x-forwarded-proto"))?.toLowerCase();
  const proto = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : "http";

  try {
    const url = new URL(`${proto}://${host}`);
    // Reject anything that smuggled a path, credentials or a query into the host header.
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    if (url.host.toLowerCase() !== host.toLowerCase()) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function firstValue(raw: string | null): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  return first ? first : null;
}
