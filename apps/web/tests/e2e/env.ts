import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "e2e.env");

/**
 * Parses tests/e2e/e2e.env. The fake values in that file always win over the
 * shell, so a real AUTH_ALLOWED_EMAILS or DATABASE_URL exported in the shell
 * never leaks into a test run. The only override is `E2E_DATABASE_URL`
 * (CI points it at its postgres service); it becomes the server's
 * `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
 */
export function loadE2eEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  const databaseUrl = process.env["E2E_DATABASE_URL"] || env["E2E_DATABASE_URL"] || "";
  env["E2E_DATABASE_URL"] = databaseUrl;
  env["DATABASE_URL"] = databaseUrl;
  env["DATABASE_URL_UNPOOLED"] = databaseUrl;
  return env;
}

export const E2E_ENV = loadE2eEnv();
export const ALLOWED_EMAIL = E2E_ENV["AUTH_ALLOWED_EMAILS"]?.split(",")[0]?.trim() ?? "izinli@example.com";
export const PASSWORD = "e2e-test-parolasi-uzun";
