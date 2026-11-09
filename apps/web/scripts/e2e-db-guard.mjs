#!/usr/bin/env node
// Guard for the E2E database (used by scripts/e2e.sh and tests/e2e/global-setup.ts).
// E2E runs `prisma migrate deploy` and TRUNCATEs the auth tables, so it must
// only ever touch a throwaway database:
//   - the database name must end with "_e2e",
//   - outside CI (CI=true) the host must be this machine.
// The E2E database comes from E2E_DATABASE_URL only; a DATABASE_URL exported in
// the shell (dev or production) is never used.
//
// CLI: node apps/web/scripts/e2e-db-guard.mjs   (checks $E2E_DATABASE_URL)
import { pathToFileURL } from "node:url";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * @param {string | undefined} url
 * @param {{ ci?: boolean }} [options]
 * @returns {string | null} a Turkish error message, or null when the URL is safe
 */
export function checkE2eDatabaseUrl(url, options = {}) {
  if (!url) return "E2E_DATABASE_URL tanımlı değil.";
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "E2E_DATABASE_URL geçerli bir bağlantı dizesi değil.";
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    return "E2E_DATABASE_URL postgresql:// ile başlamalı.";
  }
  const host = parsed.hostname.toLowerCase();
  const database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  // Host and database only: never user, password or query string.
  const target = `${host}${parsed.port ? `:${parsed.port}` : ""}/${database}`;
  if (!database.endsWith("_e2e")) {
    return `E2E veritabanının adı "_e2e" ile bitmeli (hedef: ${target}). Test verisi silinir; başka veritabanı kullanılamaz.`;
  }
  if (!options.ci && !LOCAL_HOSTS.has(host)) {
    return `E2E yalnızca yerel veritabanında çalışır (hedef: ${target}).`;
  }
  return null;
}

/**
 * @param {string | undefined} url
 * @param {{ ci?: boolean }} [options]
 */
export function assertE2eDatabaseUrl(url, options = {}) {
  const problem = checkE2eDatabaseUrl(url, options);
  if (problem) throw new Error(`E2E durduruldu: ${problem}`);
}

/** CI=true (GitHub Actions) relaxes only the host check, never the name check. */
export function isCiEnvironment(env = process.env) {
  return Boolean(env.CI) && env.CI !== "false" && env.CI !== "0";
}

const isCli = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const problem = checkE2eDatabaseUrl(process.env.E2E_DATABASE_URL, { ci: isCiEnvironment() });
  if (problem) {
    console.error(`E2E durduruldu: ${problem}`);
    process.exit(1);
  }
}
