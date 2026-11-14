import { execSync } from 'node:child_process';
import { afterAll, expect, test } from 'vitest';
import { prisma } from './app.js';

const SEED_COMMAND = 'npx prisma db seed';

afterAll(async () => {
  await prisma.$disconnect();
});

test('running the seed twice does not create duplicate records', async () => {
  execSync(SEED_COMMAND, { stdio: 'ignore' });
  const afterFirstRun = await prisma.transaction.count();

  execSync(SEED_COMMAND, { stdio: 'ignore' });
  const afterSecondRun = await prisma.transaction.count();

  expect(afterFirstRun).toBeGreaterThan(0);
  expect(afterSecondRun).toBe(afterFirstRun);
}, 60_000);
