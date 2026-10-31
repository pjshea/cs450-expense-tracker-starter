import type { PrismaClient } from '@prisma/client';

/**
 * There is no login yet, so every transaction belongs to one demo user.
 * When auth is added, replace this with the logged-in user's id.
 */
export const DEMO_USER_EMAIL = 'demo@expense-tracker.local';

export async function getDemoUserId(prisma: PrismaClient): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { name: 'Demo User', email: DEMO_USER_EMAIL }
  });
  return user.id;
}
