# Phase 5C.4 — Practice History details

GET /api/practice/history keeps its existing response when includeDetails is omitted or false. With includeDetails=true, each attempt additionally returns nullable, optional questionCode and topicName fields. IDs remain in the API for compatibility but are not displayed in the history table.

- questionCode is read from questions using practice_attempts.questionId.
- topicName is read from topics using practice_attempts.topicId: moving the question does not move its historical attempts. Names and codes are current display values, not immutable historical snapshots.
- LEFT JOINs do not filter by status. Disabled questions/topics and attempts with unavailable references stay visible. The UI displays Question unavailable / Topic unavailable for missing, null, or blank details.
- The list exposes the selected answer and saved correctness only, never the correct option, explanation, or user identity.
- Ordering (submittedAt DESC, id DESC), limit+1 and the opaque nextCursor envelope remain unchanged. New cursors retain PostgreSQL microseconds in UTC; legacy millisecond cursors remain accepted. The public submittedAt field keeps its existing millisecond formatting, and the internal exact timestamp is never returned as a DTO field. The server derives identity from req.dbUser.id; client identity parameters cannot select another user's history.
- Only literal true/false are accepted for includeDetails. Repeated or malformed values return HTTP 400.

## Authentication and cache

Requests wait for loaded Clerk authentication with both userId and sessionId. Query keys include parameters and the local user/session identity; only limit, cursor and includeDetails are sent to the API. Responses use the existing authenticated fetch client, same-origin credentials and no-store request caching.

On account switch, older history queries are cancelled and removed. Cleanup removes the outgoing session's history on sign-out or page unmount. No placeholder rows carry over between pages or identities; a new identity remounts pagination at the newest page. HTTP 401/403/500 hide stale rows and preserve the existing sign-in/retry behavior.

## Additive code generation

Run from the repository root when regenerating this contract:

~~~powershell
pnpm --filter @workspace/api-spec exec orval --config ./orval.practice-history.config.ts
~~~

The configuration generates React Query and Zod files into dedicated practice-history folders with clean=false. New exports use aliases to retain all existing client/schema exports. Do not run the general clean generation over the existing generated folders.

## Validation

Frontend tests cover display labels, missing details, privacy, auth/errors and cursors. QueryClient/QueryObserver tests exercise real cache cancellation and account switching with mocked network responses. Backend tests cover the wire contract and actual Drizzle SQL generation without PostgreSQL.

Four optional integration tests use only a dedicated loopback database named ccna_history_test (or ccna_history_test_suffix), supplied explicitly through PRACTICE_HISTORY_DETAILS_TEST_DATABASE_URL. Neon/remote URLs and other database names are rejected. These tests use session-local TEMP tables and require separate approval to prepare a local test database; they never use DATABASE_URL or .env files.

~~~powershell
pnpm --filter @workspace/api-server exec vitest run --config vitest.integration.config.ts src/lib/practice-history-details.integration.test.ts
~~~

Without that dedicated variable the four tests are skipped. No test database was provisioned and no application database was modified during this phase.

## Manual verification

1. Sign in and open /practice/history: all existing attempts should display Question Code, Topic Name, selected answer, saved result and local submission date. No UUID should appear in display cells.
2. Inspect the GET request: includeDetails=true, with no userId/sessionId request parameters and no answer/explanation fields in the response.
3. Compare responses with omitted includeDetails, includeDetails=false and includeDetails=true: the first two have only the original fields; IDs, order and nextCursor match across modes for the same page.
4. Use Next/Previous on a sufficiently long history; return to the same attempts with no duplicates or skipped rows.
5. Switch accounts or sign out during a pending request: old attempts must disappear, the new session must start on page one, and late responses must not restore the old rows.
6. Exercise 401/403/500 using browser request interception; stale rows must stay hidden. Inspect desktop and mobile layouts and links to Practice.
7. Disabled/moved-question behavior should be tested in the isolated PostgreSQL suite or a separately approved test environment. Do not edit development records merely to exercise these cases.
