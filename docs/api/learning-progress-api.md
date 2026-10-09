# Phase 5C.2 — Learning Progress API

The approved metric definitions remain in [learning-progress.md](learning-progress.md)
and [OpenAPI](../../lib/api-spec/openapi.yaml). This phase implements only
`GET /api/learning/progress`; Dashboard, Topic Map and Practice History are unchanged.

## Implementation

- `requireAuthenticatedUser` resolves Clerk identity to the PostgreSQL account.
  The service receives only `req.dbUser.id`. Both USER and ADMIN get their own progress.
  Disabled accounts get 403; unauthenticated requests get 401.
- No query parameters or request body are accepted. Authentication runs first.
  The new GET route alone bypasses global JSON/form parsing so even malformed
  bodies are rejected by the route with the contract's 400 response.
  Existing routes retain JSON-then-form parsing.
- All route responses set `Cache-Control: private, no-store`.
- A single parameterized PostgreSQL statement aggregates historical attempts
  separately from the current active catalog. All cohorts share one statement
  snapshot. The service never inserts, updates or deletes rows.
- Historical counts and accuracy use stored attempt topic and correctness.
  Global historical unique questions use a global DISTINCT, rather than a sum
  of topic DISTINCT counts.
- Current question counts use ACTIVE questions in ACTIVE topics.
  Coverage uses EXISTS against this user's historical distinct question IDs;
  repeated attempts cannot multiply catalog counts.
- A moved question retains historical attribution and gains coverage in its
  current topic. Disabled topics are returned only with this user's history.
- Percentages are rounded to two decimal places; NULLIF and COALESCE handle zero
  denominators. Response validation uses the new schema generated from OpenAPI.
- Database failures return a generic ErrorResponse. The new service error log
  excludes SQL, bound values and connection details.
- Authentication uses the existing user provisioning/profile update behavior;
  this change does not alter that middleware or add attempt writes to GET.

## Local API

From the repository root:

```powershell
pnpm run dev:local:api
```

This uses the existing guarded `.env.local` runner. No migration or seed is part
of this command. Use a real Clerk session to call the endpoint through the
frontend's existing same-origin proxy; do not use invented tokens.

## Focused additive schema generation

```powershell
pnpm --filter @workspace/api-spec exec orval --config ./orval.learning-progress.config.ts
```

This configuration includes only the new operation and writes only
`lib/api-zod/src/learning-progress/api.ts`, with `clean: false`.
It does not regenerate the existing client or either existing generated folder.
Do not edit the new generated schema manually.

## Tests

Unit/HTTP tests use the real authentication middleware, with Clerk and database
dependencies mocked at their boundaries. They do not connect to PostgreSQL or
verify real Clerk token signatures.

To prevent older opt-in DB suites from inheriting a development connection,
run the unit suite from the repository root with process-local variables cleared:

```powershell
$env:RUN_DB_TESTS = '0'
Remove-Item Env:DATABASE_URL, Env:TEST_DATABASE_URL, Env:LEARNING_PROGRESS_TEST_DATABASE_URL -ErrorAction SilentlyContinue
pnpm --filter @workspace/api-server test
```

PostgreSQL scenarios are in `src/lib/learning-progress.integration.test.ts`.
They require `LEARNING_PROGRESS_TEST_DATABASE_URL` to be configured securely in
the test process, pointing to a dedicated local database named
`ccna_progress_test` (or a suffix using lowercase letters/digits).
Do not put development or production credentials into that variable.

The suite rejects remote hosts, unexpected database names and URL options.
Before any fixture write it verifies the actual database name, loopback server
address and absence of a Neon branch identity. It mocks the default application
pool and uses one explicitly injected test connection. Fixtures use session-local
TEMP tables with the relevant column types and foreign keys; no migrations,
seeds, or permanent schema changes are performed. Session teardown removes
those temporary objects. Concurrent sessions cannot share their fixtures.

With a complete local PostgreSQL server and the dedicated test connection ready:

```powershell
pnpm --filter @workspace/api-server exec vitest run --config vitest.integration.config.ts src/lib/learning-progress.integration.test.ts
```

No test connection means all 11 scenarios are skipped. A supplied unsafe
connection is rejected rather than skipped. The cases cover repeated attempts,
66.67% accuracy, zero attempts/catalog, user isolation, attempt-weighted accuracy,
question/topic disable and reactivation, topic movement before and after a new
attempt, deterministic ordering, response validation and SELECT-only execution.

## Verification performed in this phase

- 119 unit/HTTP tests passed, including 27 new route/contract/parsing tests.
  Two existing opt-in database suites were skipped.
- API source TypeScript checking passed without diagnostics, including dependent
  workspace sources. Cached project-reference declarations were not rewritten.
- The existing API build configuration succeeded with output redirected to an
  ignored temporary folder; the existing application dist was preserved.
- A read-only smoke check ran the new service against the verified development
  branch `br-muddy-recipe-b5xsunnq`, database `neondb`, using `.env.local` only
  and verified TLS. No API/auth middleware was invoked.
  It checked both existing users against independent historical aggregates and
  topic sums. The user with history had 3 attempts, 2 correct, 66.67% accuracy,
  1 unique question, 1 available/covered question and 100% coverage.
  The other user had zero attempts and zero coverage.
- All 11 isolated PostgreSQL fixture scenarios were skipped: no dedicated test
  connection was available, and the installed command-line tools lack
  `share/postgres.bki`, so they cannot initialize a local server. No alternative
  connection to Neon was used for fixture writes.

Real Clerk HTTP verification and the 11 isolated fixture scenarios remain to be
run. Read-only smoke coverage does not replace those tests. Phase 5C.3 needs
separate approval.
