# AI Log

Add future AI-assisted work below, with a timestamp, the prompt/request, a summary of the AI response,
what you changed yourself, and how you verified it.

## Sharon Johnson (SharonSusan77)

### 2026-09-29 00:22:56 EDT

**Prompt/request**

I asked Claude (Anthropic) to walk me step by step through Individual Assignment 1 for the `cs450-expense-tracker-starter`:
creating my branch, setting up `backend/.env`, installing dependencies, starting PostgreSQL with Docker Compose,
running the Prisma migration, and making one small TypeScript verification change documented in the README.

**AI response summary**

Claude gave terminal commands for each setup step and explained what each one did. When
`npx --prefix backend prisma generate` failed with "Could not find Prisma Schema", it explained that Prisma looks for
`prisma/schema.prisma` relative to the current folder, so the commands need to run from inside `backend/`.
For the TypeScript change it suggested a typed health-check response: a `HealthResponse` interface and a
`buildHealthResponse()` helper in `backend/src/types/health.ts`, used by `GET /api/health`, adding
`uptimeSeconds` and `timestamp`. It also drafted the README "Assignment 1 Setup" section and this log entry.

**What I changed myself**

- The walkthrough's Prisma commands (`npx --prefix backend prisma generate` and `migrate dev`) failed from the
  repo root with "Could not find Prisma Schema". I ran them from inside `backend/` instead, and added that fix to
  the README troubleshooting notes.
- After reading the professor's example AI log, I had my README section and this log updated to match that format,
  and added the note explaining why `http://localhost:4002/` shows "Cannot GET /".
- My team agreed that each of us creates the Prisma `init` migration on our own branch. I created mine
  (`20260929035927_init`) and read the generated `migration.sql` to check it matched `schema.prisma`: the `User` and
  `Transaction` tables, the unique index on `email`, and the foreign key from `Transaction.userId` to `User.id`.
- I chose not to run `npm audit fix --force` or upgrade Prisma, so the starter's package versions stay unchanged.

**How I verified it**

- `npm --prefix backend run build` and `npx tsc --noEmit` (inside `backend/`) finished with no TypeScript errors.
- With the backend running, `http://localhost:4002/api/health` returned
  `{"status":"ok","app":"expense-tracker-starter","uptimeSeconds":307,"timestamp":"2026-09-29T04:29:16.736Z"}`
  in the browser, and `curl` returned the same fields.
- The dashboard at `http://localhost:5175` showed Income $2600.00, Expenses $141.39, Net $2458.61 and the three
  sample transactions, so the frontend was getting data from the backend.
- `http://localhost:4002/` showed "Cannot GET /", which is expected because the backend has no route at `/`.
- `git check-ignore` confirmed that `backend/.env` and `backend/dist` will not be committed.

## 2026-11-02 - Jovhems (F26B-72, F26B-73, F26B-32, F26B-30)
- Tool: Claude
- Used for: setting up Vitest + Supertest, splitting app.ts/index.ts, writing API tests, building the repeatable transaction data generator, implementing PUT /api/transactions/:id with Zod validation, writing the repeatable seed script, and writing seed repeatability and boundary tests.
- Verified by: running npm test, npm run generate:data, npx prisma db seed (twice, same count), and manual curl requests against the running backend. I reviewed and adjusted generated code, for example fixing the expected error message to match the real validateBody middleware.

## Sharon Johnson (SharonSusan77): Sprint 2, F26B-53 and F26B-54

**Prompt/request:** I asked Claude (Anthropic) to help me verify F26B-32 (Edit a transaction) against its acceptance
criteria, write tests that prove a valid edit is really saved, and update the architecture diagram for Sprint 2.

**AI response summary:** Claude reviewed the merged PUT route and its tests, pointed out that only error cases were
tested and that there is no edit form in the frontend, and drafted database tests that read the saved row back from
PostgreSQL, a verification report, the new edit and seed diagrams, and a fix for the missing POSTGRES variables in
the root .env.example.

**How I verified it:** I ran npm test with the database running and all 21 tests passed, including the 7 new edit
verification tests. I checked that the new diagrams render on GitHub and that docker compose starts the database
with the updated .env.example.

## Sharon Johnson (SharonSusan77): Assignment 2, CI with GitHub Actions

**Prompt/request:** I asked Claude (Anthropic) to help me add a GitHub Actions workflow that runs lint and the backend tests on pull requests.

**AI response summary:** Claude noted the backend had no lint script (so we added ESLint), the tests need PostgreSQL (so the workflow starts a temporary postgres service), and Vitest 5 needs Node 22. It drafted ci.yml and the ESLint config.

**what I verified:** npm run lint passed locally; on the PR I confirmed CI fails on an intentionally broken test and passes after the fix, and updated the readme .

## Assignment 2: GitHub Actions CI/CD Pipeline (Jovhems)

- **Date:** 2026-11-08
- **Tool:** Claude (Anthropic)
- **Purpose:** Help setting up the CI workflow, adding ESLint to the backend, writing the README "CI/CD Setup" section, and planning the failing and passing runs.
- **What I asked:** How to create a GitHub Actions workflow that installs dependencies, lints and runs tests for our backend (Express + Prisma + PostgreSQL + Vitest) and frontend (React + Vite) on pull requests.
- **What the AI produced:** A draft `ci.yml` with a PostgreSQL service container, an ESLint flat config and lint script for the backend, a README section, and a suggested intentional lint violation for the failure demo.
- **What I verified or changed:**
  - Checked our real `package.json` scripts, Prisma provider and `docker-compose.yml` before writing the workflow.
  - Confirmed `backend/.env` is ignored by git; the CI database uses throwaway credentials only.
  - Ran `npm run lint` locally before pushing.
  - Confirmed a failing run and a passing run on the Actions tab.
- **Reflection:** CI stops at the first failing step, so the earliest error in the log is the one to fix. Running tests against a fresh database in CI also caught tests that only pass when a local database happens to be running.
