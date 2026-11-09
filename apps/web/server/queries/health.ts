import "server-only";

import { prisma } from "../db";

/** `SELECT 1` against the database; never throws, never exposes the error. */
export async function isDatabaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
