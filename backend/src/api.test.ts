import { describe, expect, test } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

// These tests need no database: /api/health never touches Postgres, and invalid
// POST bodies are rejected by the Zod validateBody middleware before any Prisma call.

describe('GET /api/health', () => {
  test('reports that the backend is running', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    // toMatchObject, not toEqual: the body also has uptimeSeconds and timestamp, which change every run
    expect(response.body).toMatchObject({ status: 'ok', app: 'expense-tracker-backend' });
    expect(typeof response.body.uptimeSeconds).toBe('number');
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });
});

describe('POST /api/transactions', () => {
  test('rejects an empty transaction with 400', async () => {
    const response = await request(app).post('/api/transactions').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  test('rejects a transaction with no category and says which field is wrong', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({ title: 'Coffee', amount: 4.5 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.issues).toContainEqual({ field: 'category', message: 'Required' });
  });
  
  test('rejects an empty title and a negative amount in one response', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({ title: '', amount: -5, category: 'Food' });

    expect(response.status).toBe(400);
    const fields = response.body.issues.map((issue: { field: string }) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(['title', 'amount']));
  });

  test('rejects a type that is not expense or income', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({ title: 'Coffee', amount: 4.5, category: 'Food', type: 'refund' });

    expect(response.status).toBe(400);
    expect(response.body.issues[0].field).toBe('type');
  });
});

describe('PUT /api/transactions/:id', () => {
  test('rejects invalid data with 400', async () => {
    const response = await request(app)
      .put('/api/transactions/any-id')
      .send({ amount: 'not-a-number' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  test('rejects an empty update with 400', async () => {
    const response = await request(app).put('/api/transactions/any-id').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Provide at least one field to update');
  });

  test('returns 404 for a transaction that does not exist', async () => {
    const response = await request(app)
      .put('/api/transactions/does-not-exist')
      .send({ title: 'Coffee' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Transaction not found');
  });
  
  test('rejects an amount just over the 1,000,000 limit', async () => {
    const response = await request(app)
      .put('/api/transactions/any-id')
      .send({ amount: 1_000_001 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
  });

  test('accepts an amount of exactly 1,000,000 (passes validation)', async () => {
    const response = await request(app)
      .put('/api/transactions/does-not-exist')
      .send({ amount: 1_000_000 });

    // Validation passed, so the request reaches the lookup and gets 404, not 400.
    expect(response.status).toBe(404);
  });
});