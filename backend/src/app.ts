import { PrismaClient } from "@prisma/client";
import express from 'express';
import cors from 'cors';
import {
  createTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type UpdateTransactionInput
} from './schemas/transaction.js';
import { validateBody } from './middleware/validateBody.js';
import { getDemoUserId } from './demoUser.js';
import { buildHealthResponse, type HealthResponse } from './types/health.js';

export const prisma = new PrismaClient();

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', async (_req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get('/api/health', (_req, res) => {
  const body: HealthResponse = buildHealthResponse();
  res.json(body);
});

app.get('/api/transactions', async (_req, res) => {
  try {
    const userId = await getDemoUserId(prisma);
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load transactions' });
  }
});

app.get('/api/summary', async (_req, res) => {
  try {
    const userId = await getDemoUserId(prisma);
    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, type: 'income' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'expense' }, _sum: { amount: true } })
    ]);
    const totalIncome = income._sum.amount ?? 0;
    const totalExpenses = expenses._sum.amount ?? 0;
    res.json({ totalIncome, totalExpenses, net: totalIncome - totalExpenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not load summary' });
  }
});

app.post('/api/transactions', validateBody(createTransactionSchema), async (req, res) => {
  const { title, amount, category, type, date, description } = req.body as CreateTransactionInput;
  try {
    const userId = await getDemoUserId(prisma);
    const created = await prisma.transaction.create({
      data: {
        userId,
        title,
        amount,
        category,
        type,
        date: date ? new Date(date) : new Date(),
        description: description || null
      }
    });
    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not save transaction' });
  }
});

// F26B-32: edit an existing transaction.
app.put('/api/transactions/:id', validateBody(updateTransactionSchema), async (req, res) => {
  const changes = req.body as UpdateTransactionInput;

  if (Object.keys(changes).length === 0) {
    res.status(400).json({ error: 'Provide at least one field to update' });
    return;
  }

  try {
    const userId = await getDemoUserId(prisma);
    const existing = await prisma.transaction.findFirst({
            where: { id: String(req.params.id), userId }
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const { date, description, ...rest } = changes;
    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        ...rest,
        ...(date !== undefined && { date: new Date(date) }),
        ...(description !== undefined && { description: description || null })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not update transaction' });
  }
});
