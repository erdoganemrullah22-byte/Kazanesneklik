import pg from "pg";

import { assertE2eDatabaseUrl, isCiEnvironment } from "../../scripts/e2e-db-guard.mjs";

import { E2E_ENV } from "./env";

/**
 * Starts every run from an empty auth state (tables come from migrations).
 * The guard refuses anything but a throwaway `*_e2e` database (local unless
 * CI) before a single row is touched.
 */
export default async function globalSetup(): Promise<void> {
  const url = E2E_ENV["E2E_DATABASE_URL"];
  assertE2eDatabaseUrl(url, { ci: isCiEnvironment() });

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(
      'TRUNCATE TABLE "profiles", "sessions", "accounts", "verifications", "rate_limits", "users" RESTART IDENTITY CASCADE',
    );
  } finally {
    await client.end();
  }
}
