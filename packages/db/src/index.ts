/**
 * @kazan/db — Prisma client factory and generated types.
 *
 * Rule (plan 10.3): direct `prisma.*` access lives only in the web app's
 * `server/` query modules. This package only creates the client; it does not
 * expose a global instance.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

export { Prisma, PrismaClient } from "./generated/prisma/client";
export type { Account, Profile, Session, User, Verification } from "./generated/prisma/client";

export interface CreatePrismaClientOptions {
  /** Pooled connection string (Neon "pooled" URL in production). */
  connectionString: string;
  /**
   * Maximum connections per server instance. Serverless functions should keep
   * this small; the Neon pooler multiplexes them.
   */
  maxConnections?: number;
}

export function createPrismaClient({ connectionString, maxConnections = 5 }: CreatePrismaClientOptions): PrismaClient {
  const adapter = new PrismaPg({ connectionString, max: maxConnections });
  return new PrismaClient({ adapter });
}
