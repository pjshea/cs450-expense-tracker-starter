import { describe, expect, test } from 'vitest';
import { generateTransactions, toCsv } from './generateTransactions.js';

describe('generateTransactions', () => {
  test('creates the requested number of transactions', () => {
    expect(generateTransactions(500)).toHaveLength(500);
  });

  test('is repeatable: the same seed gives the same data', () => {
    expect(generateTransactions(200, 42)).toEqual(generateTransactions(200, 42));
  });

  test('a different seed gives different data', () => {
    expect(generateTransactions(200, 1)).not.toEqual(generateTransactions(200, 2));
  });

  test('every transaction has valid fields', () => {
    for (const t of generateTransactions(1000)) {
      expect(['income', 'expense']).toContain(t.type);
      expect(t.amount).toBeGreaterThan(0);
      expect(Math.round(t.amount * 100) / 100).toBe(t.amount);
      expect(t.date >= '2026-01-01' && t.date <= '2026-10-31').toBe(true);
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  test('rejects a negative count', () => {
    expect(() => generateTransactions(-1)).toThrow();
  });

  test('CSV has a header plus one row per transaction', () => {
    const csv = toCsv(generateTransactions(10));
    expect(csv.trim().split('\n')).toHaveLength(11);
  });
});