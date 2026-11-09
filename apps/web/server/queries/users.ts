import "server-only";

import { prisma } from "../db";

export async function findUserEmailById(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user?.email ?? null;
}
