import type { HealthResponse } from "@kazan/contracts";

import { jsonNoStore } from "@/server/http";
import { isDatabaseReachable } from "@/server/queries/health";

/**
 * Liveness + database check (plan 10.6). Public, cheap, and free of secrets:
 * no versions, hostnames or error messages. The deep AI check
 * (`?deep=1` + bearer token) arrives with K5.
 */
export async function GET() {
  const dbOk = await isDatabaseReachable();
  const body: HealthResponse = { status: dbOk ? "ok" : "degraded", db: dbOk ? "ok" : "error" };
  return jsonNoStore(body, { status: dbOk ? 200 : 503 });
}
