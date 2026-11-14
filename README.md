# Expense Tracker

A full-stack personal finance dashboard for recording spending, tracking budget health, and reviewing transaction history.

## Product overview
This application helps users monitor money movement across categories, understand monthly totals, and compare actual spending to a budget. It is a practical product for dashboard design, filtering, and financial reporting.

## Core user experience
- add income and expense entries
- assign each transaction to a category
- review totals by month or category
- see remaining budget and spending trends
- filter the transaction list by type or date range
- understand overall financial performance at a glance

## MVP features to implement
- transaction creation and editing
- category-based tracking
- monthly summary cards
- transaction list with filtering
- budget overview and remaining balance
- seeded sample data for demonstration

## Optional PM enhancements
- recurring transactions
- budget alerts and warnings
- CSV export
- shared household budget features
- category trend charts
- savings goal tracking

## Tech stack
- Backend: Node.js, Express, TypeScript
- Frontend: React + TypeScript
- Database: PostgreSQL + Prisma
- Tooling: Docker Compose

## Getting started

### Prerequisites

Install the following before starting:

- Git
- Node.js 20 or later, which includes npm
- Docker Desktop or Docker Engine with Docker Compose

### Create your project copy

1. Click **Fork** and create the fork in your own account or team organization. Forking creates your GitHub copy; it does not download the files to your computer.
2. Clone your fork, replacing `YOUR-GITHUB-USERNAME` with the account or organization that owns your fork:

```bash
git clone https://github.com/YOUR-GITHUB-USERNAME/cs450-expense-tracker.git
cd cs450-expense-tracker
```

### Configure and start the application

Run these commands from the project root:

```bash
cp backend/.env.example backend/.env
npm --prefix backend install
npm --prefix frontend install
docker compose up -d
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
```

The database runs in Docker on port `5434`. The migration command creates the
database tables from the Prisma schema.

Open two terminal windows from the project root and start the application:

Terminal 1, the backend:

```bash
npm --prefix backend run dev
```

Terminal 2, the frontend:

```bash
npm --prefix frontend run dev
```

Open http://localhost:5175 in a browser. The backend API is available at
http://localhost:4002.

To stop the database, run this from the project root:

```bash
docker compose down
```

## Expected project outcomes
- a working budgeting and transaction workflow
- a prioritized product backlog for improvement work
- a deployable app setup with clear documentation
- a final demo highlighting financial features and product decisions

## Assignment 1 Setup

**Selected app:** Team J, Expense Tracker, shared team repository at
https://github.com/mcaivano26/cs450-expense-tracker

### Ports

| Service | Port |
| --- | --- |
| Frontend (Vite) | 5175 |
| Backend (Express) | 4002 |
| PostgreSQL (Docker) | 5434 → 5432 in the container |

### Setup commands

```bash
cp backend/.env.example backend/.env
npm --prefix backend install
npm --prefix frontend install
docker compose up -d
docker compose ps
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
npm --prefix backend run dev      # terminal 1
npm --prefix frontend run dev     # terminal 2
```

> Run the Prisma commands from inside `backend/`. `npx --prefix backend prisma ...` from the repo root fails with
> "Could not find Prisma Schema" because Prisma looks for `prisma/schema.prisma` relative to the current folder.

### Verification

- `npm --prefix backend run build` compiles the backend with no TypeScript errors
- `curl http://localhost:4002/api/health` returns `status`, `app`, `uptimeSeconds` and `timestamp`
- http://localhost:5175 shows the dashboard with Income, Expenses and Net cards

### Troubleshooting

- **"Cannot GET /" at http://localhost:4002** is expected. The backend has no route at `/`; its routes are
  `/api/health`, `/api/transactions` and `/api/summary`. Open http://localhost:4002/api/health instead.
- **"Could not find Prisma Schema"** means the Prisma command ran from the repo root. Run it from inside `backend/`.
- **"the attribute `version` is obsolete"** from `docker compose up` is a harmless warning; Compose v2 ignores that field.

### TypeScript verification changes

#### Sharon Johnson (SharonSusan77)

Environment: macOS 26.6.2, Node v24.21.0, npm 11.19.0, Git 2.50.1 (Apple Git-155), Docker 29.7.2, Docker Compose 5.5.1 (recorded 2026-09-29)

- Added `backend/src/types/health.ts` with a `HealthResponse` interface and a `buildHealthResponse()` helper.
- `GET /api/health` now returns a value typed as `HealthResponse`, which adds `uptimeSeconds` and `timestamp`.
- Verified with `npm --prefix backend run build`, then by starting the backend and opening http://localhost:4002/api/health.

## Architecture and Schema

Full diagrams and decisions: [docs/architecture.md](docs/architecture.md)

- **Flow:** User → browser → React frontend (dashboard + Add a transaction form) → REST / JSON → Express backend → Prisma → PostgreSQL in Docker.
- **Validation:** `POST` requests go through a reusable Zod `validateBody` middleware; bad input returns `400` with field errors that the form shows under each field.
- **Schema (Sprint 1):** `User` has many `Transaction`s. Income and expenses share one `Transaction` table with a `type` field, so totals and net balance are simple queries.
- **Next:** `Category` and `Budget` tables, Login with JWT, edit and filter transactions.
- **Workflow:** every branch and PR title starts with its Jira key (F26B-xx).


## Run with Docker

1. `cp .env.example .env`
2. `docker compose up --build`
3. Access UI: http://localhost:5175
4. Verify API: `curl http://localhost:4002/api/health`
5. Shutdown: `docker compose down`

### Diagnostics & Verification Log

| Component | Observed Behavior | Underlying Concept |
|---|---|---|
| Startup Order | `api` waits for `db` healthcheck | Process running != DB connection ready |
| Network Bridge | `web` reaches `api:4002` | Docker Compose virtual network DNS |

## Seeding and sample data

Start the database first (from the project root):

```bash
docker compose up -d
```

Seed the database. It is safe to run more than once: it removes its own sample rows and re-creates them, so there are no duplicates.

```bash
cd backend
npx prisma db seed      # or: npm run seed
```

Generate a large set of repeatable sample transactions to files:

```bash
npm --prefix backend run generate:data            # 1,000 transactions, seed 42
npm --prefix backend run generate:data -- 50000 7 # 50,000 transactions, seed 7
```

Output goes to `backend/data/transactions.json` and `backend/data/transactions.csv` (git-ignored).

## CI/CD Setup

Every pull request into `main` runs `.github/workflows/ci.yml` on GitHub Actions. Merge only when both jobs are green.

- **Backend:** `npm ci`, `npm run lint` (ESLint), then `npm test` against a temporary PostgreSQL 16 database that exists only during the run.
- **Frontend:** `npm ci`, then `npm run build` (type-check and build; no tests yet).
- Read-only access (`contents: read`), Node 22 (required by Vitest 5).

**Reading a failed run:** on the PR, click **Details** next to the red X, open the failed job, and click the first red step. Fix that first error; later steps are skipped, not broken. Lint errors show `file line:column` and the rule name; test failures show the test name with `Expected` vs `Received`. Reproduce it locally with `npm run lint` or `npm test`, fix it, and push. CI reruns automatically.
