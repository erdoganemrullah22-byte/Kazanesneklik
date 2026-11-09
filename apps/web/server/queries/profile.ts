import "server-only";

import type { Profile } from "@kazan/db";

import { prisma } from "../db";

/** Creates the profile that belongs to a freshly created user (idempotent). */
export async function ensureProfileForUser(userId: string, displayName: string | null): Promise<void> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, displayName },
    update: {},
  });
}

export async function findProfileByUserId(userId: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { userId } });
}
