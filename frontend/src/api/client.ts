import type { Summary, Transaction, FieldIssue, NewTransaction } from '../types/api.ts';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchTransactions(): Promise<Transaction[]> {
  return getJson<Transaction[]>('/api/transactions');
}

export function fetchSummary(): Promise<Summary> {
  return getJson<Summary>('/api/summary');
}

/** Saves an expense or income. Returns null on success, or the list of field problems. */
export async function createTransaction(input: NewTransaction): Promise<FieldIssue[] | null> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...input,
      // the API expects a full date-time; noon UTC keeps the same day everywhere
      date: `${input.date}T12:00:00Z`,
      description: input.description || undefined
    })
  });
  if (response.status === 201) return null;
  if (response.status === 400) {
    const body = await response.json();
    return body.issues ?? [{ field: '', message: body.error ?? 'Validation failed' }];
  }
  return [{ field: '', message: 'Something went wrong saving. Is the backend running?' }];
}
