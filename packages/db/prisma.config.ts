import { defineConfig } from "prisma/config";

/**
 * Prisma CLI configuration (Prisma 7).
 *
 * The CLI (migrate, validate, generate) reads the connection string from here.
 * Migrations need a *direct* (unpooled) connection, so `DATABASE_URL_UNPOOLED`
 * wins when it is set (Neon / Vercel integration name); otherwise
 * `DATABASE_URL` is used. The application itself connects through the pooled
 * `DATABASE_URL` via the `@prisma/adapter-pg` driver adapter (src/client.ts).
 *
 * The URL is optional here so that `prisma generate` and `prisma validate`
 * work without a database (CI, fresh clones).
 */
const url = process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(url ? { datasource: { url } } : {}),
});
