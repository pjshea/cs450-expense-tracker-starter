# Expense Tracker: Architecture and Schema

Team J (Max, Jovhems, Sharon) · CS 450 · Sprint 1

This page shows how the app is put together, how one request travels through it, and how the data is stored.
Boxes with a **dashed border** are planned for later sprints; solid boxes exist in the code today.
Our original hand-drawn sketch is in [architecture-sketch.pdf](architecture-sketch.pdf) (if present).

## 1. System architecture

```mermaid
flowchart TD
  user(["① User"])
  browser["Web browser<br/>http://localhost:5175"]

  subgraph FE["② Frontend · React 18 + Vite + TypeScript · port 5175"]
    direction TB
    app["App.tsx · Dashboard<br/>summary cards + transaction list"]
    form["AddTransactionForm<br/>Expense / Income switch"]
    client["api/client.ts<br/>fetchTransactions · fetchSummary · createTransaction"]
    login["Login page"]:::planned
    budgetUi["Budget page"]:::planned
    app --> client
    form --> client
  end

  subgraph BE["④ Backend · Express 4 + TypeScript · port 4002"]
    direction TB
    mw["cors + express.json"]
    routes["Routes<br/>GET /api/transactions<br/>GET /api/summary<br/>POST /api/transactions<br/>GET /api/health"]
    zod{"validateBody<br/>Zod schema"}
    prisma["Prisma Client"]
    auth["requireAuth (JWT)"]:::planned
    newRoutes["/api/categories · /api/budgets"]:::planned
    mw --> routes
    routes -- "POST body" --> zod
    zod -- "valid" --> prisma
    routes -- "GET" --> prisma
  end

  subgraph DB["⑤ PostgreSQL 16 · Docker Compose · port 5434"]
    direction LR
    tUser[("User")]
    tTx[("Transaction")]
    tCat[("Category")]:::planned
    tBud[("Budget")]:::planned
  end

  user --> browser
  browser -- "loads app" --> app
  client -- "③ REST / JSON over HTTP<br/>(Vite proxies /api → :4002)" --> mw
  zod -. "400 + field errors" .-> form
  prisma -- "SQL" --> tTx
  prisma -- "SQL" --> tUser

  classDef planned stroke-dasharray: 5 5,fill:#f8fafc,color:#64748b
```

| # | Layer | What it does | Key files |
| --- | --- | --- | --- |
| ① | User | Opens the app in a web browser | |
| ② | Frontend | React dashboard: summary cards, transaction list, and the Add a transaction form (expense or income) | `frontend/src/App.tsx`, `components/AddTransactionForm.tsx` |
| ③ | REST API / JSON | The frontend only talks to the backend through JSON over HTTP. In development, Vite forwards `/api` to port 4002 | `frontend/src/api/client.ts`, `frontend/vite.config.ts` |
| ④ | Backend | Express routes. `POST` bodies are checked by the Zod `validateBody` middleware first; bad input gets a `400` with a list of field errors and never reaches the database. Valid requests go through Prisma | `backend/src/index.ts`, `middleware/validateBody.ts`, `schemas/transaction.ts` |
| ⑤ | Database | PostgreSQL 16 running in Docker Compose, so every teammate has the same database on the same port | `docker-compose.yml`, `backend/prisma/schema.prisma` |

## 2. One request, step by step: adding an expense

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant F as AddTransactionForm (React)
  participant C as api/client.ts
  participant R as POST /api/transactions
  participant V as validateBody (Zod)
  participant P as Prisma Client
  participant D as PostgreSQL

  U->>F: Fill title, amount, category, date → Add expense
  F->>C: createTransaction({ type: "expense", ... })
  C->>R: POST JSON
  R->>V: check body
  alt invalid (empty title, amount ≤ 0, ...)
    V-->>C: 400 { error, issues: [{ field, message }] }
    C-->>F: field issues
    F-->>U: red message under each field
  else valid
    V->>P: cleaned data
    P->>D: INSERT INTO "Transaction"
    D-->>P: new row
    P-->>C: 201 + saved transaction
    C-->>F: success
    F->>C: refresh list + summary (GET)
    F-->>U: "Expense saved ✓", list and cards update
  end
```

Adding income is the same flow with `type: "income"`.

## 3. Database schema

### Current schema (Sprint 1, matches `backend/prisma/schema.prisma`)

```mermaid
erDiagram
  User ||--o{ Transaction : "has many"
  User {
    String id PK "cuid()"
    String name
    String email UK
  }
  Transaction {
    String id PK "cuid()"
    String userId FK
    String title
    Float amount
    String category "plain text for now"
    DateTime date
    String type "expense or income"
    String description "optional"
  }
```

### Target schema (next sprints)

```mermaid
erDiagram
  User ||--o{ Transaction : "records"
  User ||--o{ Category : "owns"
  User ||--o{ Budget : "sets"
  Category ||--o{ Transaction : "groups"
  Category ||--o{ Budget : "limits"
  User {
    String id PK
    String name
    String email UK
    String passwordHash "added with Login"
  }
  Transaction {
    String id PK
    String userId FK
    String categoryId FK "replaces category text"
    String title
    Float amount
    DateTime date
    String type "expense or income"
    String description "optional"
  }
  Category {
    String id PK
    String userId FK
    String name "unique per user"
    String type "expense or income"
  }
  Budget {
    String id PK
    String userId FK
    String categoryId FK
    Float limitAmount "max to spend"
    String month "YYYY-MM"
  }
```

What changes from current to target:
- **Category** becomes its own table, and `Transaction.category` (text) becomes `categoryId`, so names stay consistent and filters work by id.
- **Budget** stores a monthly spending limit per category (`month` like `2026-10`).
- **User** gets a `passwordHash` when Login is added.

## 4. Design decisions

| Decision | Why |
| --- | --- |
| TypeScript on both frontend and backend | One language across the stack; `tsc` catches mismatched data shapes before runtime |
| REST + JSON between frontend and backend | Simple, easy to test with `curl`, and the browser never talks to the database directly |
| Vite proxy for `/api` in development | The frontend calls `/api/...` with no hardcoded port or CORS issues |
| One `Transaction` table with a `type` field | Income and expenses have the same fields, so totals and net balance are simple queries |
| Zod validation as reusable middleware | Bad input is stopped before the database with clear `400` field errors the form can show |
| Prisma ORM with migrations | The schema lives in code and every change is a versioned migration in Git |
| PostgreSQL in Docker Compose | Same database version and port for everyone, nothing to install by hand |
| Every record belongs to a `User` | Ready for Login: each user will only see their own data. Until then a single demo user is used |
| Separate `Category` table (planned) | Avoids "Food" vs "food" typos; budgets and filters point to the same category |
| Jira key in every branch and PR title | Each change traces back to a backlog story |

## 5. Backlog stories this supports

| Story | How the architecture supports it | Status |
| --- | --- | --- |
| F26B-9 Add an expense | `POST /api/transactions` with `type: "expense"` + Add a transaction form | Sprint 1 |
| F26B-40 Add income | Same route and form with `type: "income"` | Sprint 1 |
| F26B-31 View transaction history | `GET /api/transactions` from PostgreSQL, shown in the list | Sprint 1 |
| F26B-41 View income, expense, and net balance | `GET /api/summary`, shown in the three cards | Sprint 1 |
| F26B-32 Edit a transaction | Add `PUT /api/transactions/:id` reusing the Zod schema | Next |
| F26B-5 / F26B-10 Track and filter by category | `Category` table + `categoryId` on Transaction | Next |
| F26B-42 Filter by date | `date` column, filter with query params | Next |
| F26B-7 View monthly summary | Group transactions by month in `/api/summary` | Next |
| F26B-8 View budget | `Budget` table + `/api/budgets` + Budget page | Next |