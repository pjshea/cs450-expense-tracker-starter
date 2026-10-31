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
