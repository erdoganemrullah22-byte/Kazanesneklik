import "server-only";

import { createPrismaClient, type PrismaClient } from "@kazan/db";

import { env } from "@/lib/env";

/**
 * Single Prisma client per server instance. Only `server/queries/**` (and the
 * Better Auth adapter in `server/auth.ts`) may import this module; ESLint
 * enforces the boundary (plan 10.3).
 */
const globalForPrisma = globalThis as typeof globalThis & { __kazanPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__kazanPrisma ?? createPrismaClient({ connectionString: env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__kazanPrisma = prisma;
}
