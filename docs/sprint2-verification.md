# Sprint 2 verification: F26B-32 Edit a transaction

F26B-53 (Sharon Johnson). Checked against the merged code on `main` (PR #20 `PUT /api/transactions/:id`).

## How it was verified

- Automated: `backend/src/editTransaction.test.ts` sends real HTTP requests to the app (Supertest), then reads the
  row back from PostgreSQL to confirm what was actually saved. Run with the database up:
  `docker compose up -d db`, then `cd backend && npm test`.
- Manual: the same requests with curl against the running backend (commands below).

## Results

| # | Behavior checked | Result | Evidence |
| --- | --- | --- | --- |
| 1 | A valid edit is saved to the database and returned (200) | Pass | Test "a valid edit is saved and returned" |
| 2 | Fields that were not sent stay the same (partial edit) | Pass | Test "fields that were not sent stay the same" |
| 3 | The edited values appear in the transaction list (`GET /api/transactions`) | Pass | Test "the edited values show up in the transaction list" |
| 4 | Changing the type (expense to income) updates the income, expense and net totals | Pass | Test "changing expense to income moves the amount in the summary" |
| 5 | Invalid values (empty title, negative amount) return 400 with field errors and nothing is changed | Pass | Test "an invalid edit returns 400 and changes nothing" |
| 6 | Boundary: amount 0 is rejected, exactly 1,000,000 is accepted and saved | Pass | Test "boundary: an amount of 0 is rejected, exactly 1,000,000 is saved" |
| 7 | An empty update returns 400 | Pass | Existing test in `api.test.ts` ("rejects an empty update with 400") |
| 8 | Editing a transaction that does not exist returns 404 | Pass | Test "editing a transaction that does not exist returns 404" |
| 9 | A user can edit a transaction from the app's UI | Not done | There is no edit button or form in the frontend yet. Editing works through the API only. Carry over to Sprint 3. |

## Manual check with curl

```bash
# create one, then copy its "id" from the response
curl -s -X POST http://localhost:4002/api/transactions -H "Content-Type: application/json" \
  -d '{"title":"Coffee","amount":4.5,"category":"Dining","type":"expense"}'

# valid edit (expect 200 and the new values)
curl -s -X PUT http://localhost:4002/api/transactions/<id> -H "Content-Type: application/json" \
  -d '{"title":"Lunch","amount":12.75}'

# invalid edit (expect 400 with issues for title and amount)
curl -s -X PUT http://localhost:4002/api/transactions/<id> -H "Content-Type: application/json" \
  -d '{"title":"","amount":-5}'

# not found (expect 404)
curl -s -X PUT http://localhost:4002/api/transactions/does-not-exist -H "Content-Type: application/json" \
  -d '{"title":"Lunch"}'
```

## Notes

- Test files run one at a time (`backend/vitest.config.ts`) because the database tests share one PostgreSQL database.
- If the database is not running, the edit verification tests are skipped instead of failing.