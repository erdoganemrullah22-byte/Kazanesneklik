/**
 * Content-Security-Policy builder (plan 10.13). A fresh nonce per request;
 * Next.js reads it from the request header and applies it to its own scripts.
 * `'strict-dynamic'` lets those scripts load the chunks they need.
 * `style-src 'unsafe-inline'` is kept until Faz 2 (plan 10.13) because UI
 * libraries set inline style attributes.
 */
export function buildContentSecurityPolicy(nonce: string, { isDev }: { isDev: boolean }): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "worker-src": ["'self'"],
    "manifest-src": ["'self'"],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
