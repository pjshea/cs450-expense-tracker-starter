import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type GeneratedTransaction = {
  title: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD
  description: string | null;
};

type Group = { category: string; titles: string[]; min: number; max: number };

const EXPENSES: Group[] = [
  { category: 'Groceries', titles: ['Groceries', 'Supermarket run', 'Farmers market'], min: 15, max: 180 },
  { category: 'Rent', titles: ['Monthly rent'], min: 900, max: 1600 },
  { category: 'Utilities', titles: ['Electric bill', 'Water bill', 'Internet'], min: 40, max: 160 },
  { category: 'Transport', titles: ['Gas', 'Bus pass', 'Rideshare'], min: 5, max: 90 },
  { category: 'Dining', titles: ['Coffee', 'Lunch out', 'Pizza night'], min: 4, max: 75 },
  { category: 'Entertainment', titles: ['Movie tickets', 'Streaming subscription', 'Concert'], min: 8, max: 120 },
  { category: 'Health', titles: ['Pharmacy', 'Gym membership', 'Doctor copay'], min: 10, max: 150 }
];

const INCOME: Group[] = [
  { category: 'Salary', titles: ['Paycheck'], min: 1200, max: 2600 },
  { category: 'Freelance', titles: ['Freelance project', 'Tutoring'], min: 50, max: 600 }
];

// Small seeded random generator: same seed -> same numbers every run.
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateTransactions(count: number, seed = 42): GeneratedTransaction[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('count must be a non-negative whole number');
  }

  const random = createRandom(seed);
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
  const start = Date.UTC(2026, 0, 1); // Jan 1, 2026
  const days = 304;                   // through Oct 31, 2026

  const transactions: GeneratedTransaction[] = [];
  for (let i = 0; i < count; i++) {
    const isIncome = random() < 0.15;
    const group = pick(isIncome ? INCOME : EXPENSES);
    const amount = Math.round((group.min + random() * (group.max - group.min)) * 100) / 100;
    const date = new Date(start + Math.floor(random() * days) * 86_400_000).toISOString().slice(0, 10);

    transactions.push({
      title: pick(group.titles),
      amount,
      category: group.category,
      type: isIncome ? 'income' : 'expense',
      date,
      description: null
    });
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date));
}

export function toCsv(transactions: GeneratedTransaction[]): string {
  const header = 'title,amount,category,type,date,description';
  const rows = transactions.map((t) =>
    [t.title, t.amount.toFixed(2), t.category, t.type, t.date, t.description ?? '']
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n') + '\n';
}

// Only write files when run directly (not when imported by tests).
if (process.argv[1]?.endsWith('generateTransactions.ts')) {
  const count = Number(process.argv[2] ?? 1000);
  const seed = Number(process.argv[3] ?? 42);
  const transactions = generateTransactions(count, seed);

  const outDir = resolve(process.cwd(), 'data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'transactions.json'), JSON.stringify(transactions, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'transactions.csv'), toCsv(transactions));

  console.log(`Wrote ${transactions.length} transactions (seed ${seed}) to ${outDir}`);
}