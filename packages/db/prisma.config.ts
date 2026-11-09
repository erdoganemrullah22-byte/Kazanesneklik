import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import { defineConfig } from "prisma/config";

import { assertDevCommandIsLocal, resolveCliDatabaseUrl } from "./src/database-url";

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * Database selection lives in `src/database-url.ts`: process environment
 * first (`DATABASE_URL_UNPOOLED`, then `DATABASE_URL`: Vercel, CI, `pnpm e2e`,
 * one-off command lines), and only then `DATABASE_URL` from the web app's
 * `apps/web/.env.local` for local development. `.env.local` is parsed, not
 * loaded into `process.env`, and its `DATABASE_URL_UNPOOLED` is ignored.
 *
 * Dev-only commands (`migrate dev`, `migrate reset`, `db push`) refuse a
 * non-local database. The application itself connects through the pooled
 * `DATABASE_URL` via the `@prisma/adapter-pg` driver adapter (src/index.ts).
 *
 * The URL is optional so that `prisma generate` and `prisma validate` work
 * without a database (CI, fresh clones).
 */
const localEnvFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../apps/web/.env.local");
const localFileEnv = existsSync(localEnvFile) ? parseEnv(readFileSync(localEnvFile, "utf8")) : {};

const resolved = resolveCliDatabaseUrl(process.env, localFileEnv);
assertDevCommandIsLocal(process.argv.slice(2), resolved, process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(resolved ? { datasource: { url: resolved.url } } : {}),
});
