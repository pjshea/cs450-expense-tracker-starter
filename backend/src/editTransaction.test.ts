import { afterAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import { app, prisma } from './app.js';

// F26B-53: verify the acceptance criteria of F26B-32 (Edit a transaction) end to end:
// HTTP request -> Zod validation -> Prisma -> PostgreSQL, then read back what was saved.
// These tests need the database (docker compose up -d) and are skipped when it is not running.

const dbAvailable = await prisma.$queryRaw`SELECT 1`.then(() => true, () => false);
const createdIds: string[] = [];

async function createTransaction() {
  const response = await request(app)
    .post('/api/transactions')
    .send({ title: 'F26B-53 test coffee', amount: 4.5, category: 'Dining', type: 'expense', date: '2026-10-01T12:00:00Z' });
  expect(response.status).toBe(201);
  createdIds.push(response.body.id);
  return response.body as { id: string; title: string; amount: number; category: string; type: string; date: string };
}

describe.runIf(dbAvailable)('F26B-32 Edit a transaction (PostgreSQL)', () => {
  afterAll(async () => {
    await prisma.transaction.deleteMany({ where: { id: { in: createdIds } } });
  });

  test('a valid edit is saved and returned', async () => {
    const original = await createTransaction();

    const response = await request(app)
      .put(`/api/transactions/${original.id}`)
      .send({ title: 'F26B-53 test lunch', amount: 12.75 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: original.id, title: 'F26B-53 test lunch', amount: 12.75 });

    const saved = await prisma.transaction.findUniqueOrThrow({ where: { id: original.id } });
    expect(saved.title).toBe('F26B-53 test lunch');
    expect(saved.amount).toBe(12.75);
  });

  test('fields that were not sent stay the same', async () => {
    const original = await createTransaction();

    await request(app).put(`/api/transactions/${original.id}`).send({ amount: 9 });

    const saved = await prisma.transaction.findUniqueOrThrow({ where: { id: original.id } });
    expect(saved.amount).toBe(9);
    expect(saved.title).toBe(original.title);
    expect(saved.category).toBe(original.category);
    expect(saved.type).toBe(original.type);
    expect(saved.date.toISOString()).toBe(new Date(original.date).toISOString());
  });

  test('the edited values show up in the transaction list', async () => {
    const original = await createTransaction();
    await request(app).put(`/api/transactions/${original.id}`).send({ category: 'Groceries' });

    const list = await request(app).get('/api/transactions');
    const row = list.body.find((t: { id: string }) => t.id === original.id);
    expect(row.category).toBe('Groceries');
  });

  test('changing expense to income moves the amount in the summary', async () => {
    const original = await createTransaction();
    const before = (await request(app).get('/api/summary')).body;

    await request(app).put(`/api/transactions/${original.id}`).send({ type: 'income' });

    const after = (await request(app).get('/api/summary')).body;
    expect(after.totalIncome).toBeCloseTo(before.totalIncome + original.amount, 2);
    expect(after.totalExpenses).toBeCloseTo(before.totalExpenses - original.amount, 2);
  });

  test('an invalid edit returns 400 and changes nothing', async () => {
    const original = await createTransaction();

    const response = await request(app)
      .put(`/api/transactions/${original.id}`)
      .send({ title: '', amount: -5 });

    expect(response.status).toBe(400);
    const fields = response.body.issues.map((issue: { field: string }) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'amount']));

    const saved = await prisma.transaction.findUniqueOrThrow({ where: { id: original.id } });
    expect(saved.title).toBe(original.title);
    expect(saved.amount).toBe(original.amount);
  });

  test('boundary: an amount of 0 is rejected, exactly 1,000,000 is saved', async () => {
    const original = await createTransaction();

    const zero = await request(app).put(`/api/transactions/${original.id}`).send({ amount: 0 });
    expect(zero.status).toBe(400);

    const max = await request(app).put(`/api/transactions/${original.id}`).send({ amount: 1_000_000 });
    expect(max.status).toBe(200);
    const saved = await prisma.transaction.findUniqueOrThrow({ where: { id: original.id } });
    expect(saved.amount).toBe(1_000_000);
  });

  test('editing a transaction that does not exist returns 404', async () => {
    const response = await request(app).put('/api/transactions/does-not-exist').send({ title: 'Coffee' });
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Transaction not found');
  });
});

if (dbAvailable === false) {
  describe('F26B-32 Edit a transaction (PostgreSQL)', () => {
    test.skip('skipped: PostgreSQL is not running (start it with docker compose up -d)', () => {});
  });
}