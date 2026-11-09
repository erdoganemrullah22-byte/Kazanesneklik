import { type AiSmokeResponse } from "@kazan/contracts";

import { env } from "@/lib/env";
import { runSmokeForServer } from "@/server/ai";
import { isSameOrigin, jsonNoStore, notFound } from "@/server/http";
import { getAllowedSession, getSession } from "@/server/session";

/**
 * First live AI check (plan 10.14 E). Only works when `AI_LIVE=true` and the
 * caller is a signed-in, allowlisted user; otherwise the endpoint does not
 * exist (404) or is forbidden (403). The response carries only
 * `{ ok, model, stop_reason, latencyMs }` (+ an error code on failure).
 */
export async function POST(request: Request) {
  if (!env.AI_LIVE) return notFound();
  if (!isSameOrigin(request)) return notFound();

  const session = await getSession();
  if (!session) return notFound();
  if (!(await getAllowedSession())) {
    return jsonNoStore({ error: { code: "FORBIDDEN", message: "Bu işlem için yetkin yok." } }, { status: 403 });
  }

  const result: AiSmokeResponse = await runSmokeForServer();
  return jsonNoStore(result, { status: result.ok ? 200 : 502 });
}
