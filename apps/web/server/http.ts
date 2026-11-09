import "server-only";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";

const appOrigin = new URL(env.BETTER_AUTH_URL).origin;

/**
 * CSRF guard for Route Handler mutations (plan 10.13): the `Origin` header
 * must be our own origin. Browsers always send it on cross-site POSTs.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === appOrigin;
}

export function jsonNoStore<T>(body: T, init: ResponseInit = {}): NextResponse<T> {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function notFound(): NextResponse {
  return jsonNoStore({ error: { code: "NOT_FOUND", message: "Bulunamadı." } }, { status: 404 });
}
