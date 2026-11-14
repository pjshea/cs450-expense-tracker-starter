// F26B-30: seed sample transactions for the demo user.
// Safe to run more than once: it removes the rows it created last time, then re-creates them.
import { PrismaClient } from '@prisma/client';
import { generateTransactions } from '../src/data/generateTransactions.js';
import { getDemoUserId } from '../src/demoUser.js';

const prisma = new PrismaClient();
const SEED_MARKER = 'Seeded sample data (F26B-30)';
const SEED_COUNT = 50;

async function main() {
  const userId = await getDemoUserId(prisma);

  const rows = generateTransactions(SEED_COUNT, 42).map((t) => ({
    userId,
    title: t.title,
    amount: t.amount,
    category: t.category,
    type: t.type,
    date: new Date(`${t.date}T12:00:00Z`),
    description: SEED_MARKER
  }));

  await prisma.$transaction([
    prisma.transaction.deleteMany({ where: { userId, description: SEED_MARKER } }),
    prisma.transaction.createMany({ data: rows })
  ]);

  const total = await prisma.transaction.count({ where: { userId } });
  console.log(`Seeded ${rows.length} sample transactions (demo user now has ${total}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
