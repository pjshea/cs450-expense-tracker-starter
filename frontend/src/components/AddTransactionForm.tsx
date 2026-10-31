import { useState, type FormEvent } from 'react';
import { createTransaction } from '../api/client.ts';
import type { FieldIssue, TransactionType } from '../types/api.ts';

const CATEGORIES: Record<TransactionType, string[]> = {
  expense: ['Food', 'Bills', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Refund', 'Other']
};
const PLACEHOLDERS: Record<TransactionType, { title: string; amount: string }> = {
  expense: { title: 'Coffee', amount: '4.50' },
  income: { title: 'Paycheck', amount: '1200.00' }
};
const today = () => new Date().toISOString().slice(0, 10);

interface Props {
  onSaved: () => void;
}

/** One form for both stories: F26B-9 Add an expense and F26B-40 Add income. */
export default function AddTransactionForm({ onSaved }: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [issues, setIssues] = useState<FieldIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const errorFor = (field: string) => issues.find((i) => i.field === field)?.message;
  const generalError = issues.find((i) => i.field === '')?.message;
  const label = type === 'expense' ? 'expense' : 'income';

  function switchType(next: TransactionType) {
    setType(next);
    setCategory(CATEGORIES[next][0]);
    setIssues([]);
    setSavedMessage('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');
    const result = await createTransaction({
      type,
      title,
      amount: amount === '' ? undefined : Number(amount),
      category,
      date,
      description
    });
    setSaving(false);
    if (result) {
      setIssues(result);
      return;
    }
    setIssues([]);
    setTitle('');
    setAmount('');
    setDescription('');
    setDate(today());
    setSavedMessage(type === 'expense' ? 'Expense saved ✓' : 'Income saved ✓');
    onSaved();
  }

  const input: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 8, boxSizing: 'border-box' };
  const err: React.CSSProperties = { color: '#dc2626', fontSize: '0.8rem', marginTop: 4 };
  const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: 4 };
  const toggle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '0.45rem 1rem',
    border: `1px solid ${active ? color : '#cbd5e1'}`,
    background: active ? color : '#fff',
    color: active ? '#fff' : '#334155',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 600
  });
  const accent = type === 'expense' ? '#dc2626' : '#16a34a';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', borderRadius: 12, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
      <h2 style={{ marginTop: 0 }}>Add a transaction</h2>

      <div role="group" aria-label="Transaction type" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button type="button" aria-pressed={type === 'expense'} onClick={() => switchType('expense')} style={toggle(type === 'expense', '#dc2626')}>
          Expense
        </button>
        <button type="button" aria-pressed={type === 'income'} onClick={() => switchType('income')} style={toggle(type === 'income', '#16a34a')}>
          Income
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={fieldLabel} htmlFor="title">Title</label>
          <input id="title" style={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={PLACEHOLDERS[type].title} />
          {errorFor('title') && <div style={err}>{errorFor('title')}</div>}
        </div>
        <div>
          <label style={fieldLabel} htmlFor="amount">Amount ($)</label>
          <input id="amount" style={input} type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={PLACEHOLDERS[type].amount} />
          {errorFor('amount') && <div style={err}>{errorFor('amount')}</div>}
        </div>
        <div>
          <label style={fieldLabel} htmlFor="category">Category</label>
          <select id="category" style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES[type].map((c) => <option key={c}>{c}</option>)}
          </select>
          {errorFor('category') && <div style={err}>{errorFor('category')}</div>}
        </div>
        <div>
          <label style={fieldLabel} htmlFor="date">Date</label>
          <input id="date" style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {errorFor('date') && <div style={err}>{errorFor('date')}</div>}
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <label style={fieldLabel} htmlFor="description">Note (optional)</label>
        <input id="description" style={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any extra details" />
        {errorFor('description') && <div style={err}>{errorFor('description')}</div>}
      </div>
      {generalError && <div style={{ ...err, marginTop: '1rem' }}>{generalError}</div>}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="submit" disabled={saving} style={{ background: accent, color: '#fff', border: 0, borderRadius: 8, padding: '0.6rem 1.2rem', cursor: 'pointer' }}>
          {saving ? 'Saving…' : `Add ${label}`}
        </button>
        {savedMessage && <span style={{ color: '#16a34a' }}>{savedMessage}</span>}
      </div>
    </form>
  );
}
