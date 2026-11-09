import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { buildContentSecurityPolicy, createNonce } from "@/lib/csp";
import { isProtectedPath } from "@/lib/redirect";

/**
 * Runs before page routes (Next.js 16 "proxy", formerly middleware):
 *  1. Optimistic auth gate: protected pages without a session cookie are
 *     redirected to /giris. The real check happens on the server in
 *     `requireUser()`; a forged cookie gets no further than that.
 *  2. Per-request CSP nonce (plan 10.13).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.search = "";
    url.searchParams.set("sonra", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const nonce = createNonce();
  const csp = buildContentSecurityPolicy(nonce, { isDev: process.env.NODE_ENV === "development" });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Everything except API routes, Next.js assets and public files.
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|sw.js|manifest.webmanifest|apple-touch-icon.png|icons/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
