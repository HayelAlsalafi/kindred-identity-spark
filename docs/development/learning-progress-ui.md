# Phase 5C.3 — Dashboard and Topic Map

Metric definitions and the API contract remain unchanged in
[learning-progress.md](../api/learning-progress.md) and OpenAPI.

## Data and interface

Dashboard and Topic Map use the generated `useGetLearningProgress` hook for
all learner counts, answer accuracy and current coverage. The existing public
topic catalog supplies only descriptions and slugs; its placeholder statistics
are never used. Missing catalog metadata does not hide valid progress.

Historical attempts, correct attempts and unique historical questions have
separate labels. Current covered/available counts and coverage bars are separate
from historical accuracy. Percentages preserve up to two decimal places, including
66.67%. Disabled topics with personal history appear in a separate historical
section and have no practice action. Active topics without available questions
have an explicit empty state.

Study Time, Avg. Time, Streak Days and the static weekly activity graphic are
removed. Focus links use the first active topic with available questions in the
server's existing order; no unsupported recommendation score is introduced.
Existing navigation paths and the Practice History page remain unchanged.

## Authentication and cache

- Private progress components mount only after Clerk is loaded, signed in and
  provides both userId and sessionId.
- The query key is `[/api/learning/progress, { userId, sessionId }]`.
  These IDs are local cache metadata only and are never sent as GET parameters.
- Requests use the existing customFetch client and same-origin session cookies.
  No bearer token getter or authentication bypass is added.
- A guard inside ClerkProvider cancels and removes other sessions' progress on
  identity changes or sign-out. Component keys change with identity. The generated
  query consumes AbortSignal so late responses cannot restore removed cache data.
- Queries have no previous-data placeholder, no automatic retries, gcTime 0 and
  refetchOnMount always. Unauthorized, forbidden and API-error states hide old
  results, including after background request failures.
- Shared account/profile and administrator-access cache keys also include the
  current user/session and use gcTime 0. This prevents the sidebar or role bridge
  showing another account's cached identity. Server authorization is unchanged.

## Submit Answer

Practice keeps its existing feedback and selection behavior. Hook-level mutation
onSuccess invalidates exactly the submitting session's progress query. The session
is captured in onMutate, so a late answer response cannot invalidate a newly
selected account. Active observers refetch; navigation back to Dashboard or Topic
Map fetches current data even when the previous progress query has been collected.

Failed submissions do not invalidate progress and do not optimistically increment
counts. No Practice History invalidation or UI change is added in this phase.

## Safe additive generation

```powershell
pnpm --filter @workspace/api-spec exec orval --config ./orval.learning-progress-client.config.ts
```

This writes only the new `lib/api-client-react/src/learning-progress/` directory
with `clean: false`. Do not edit those generated files manually or use the broad
clean configuration over existing generated modifications.

## Checks performed

- 50 frontend tests pass: 34 new UI/cache/mutation tests plus all 16 unchanged
  Practice History tests.
- UI rendering tests cover 3 attempts, 2 correct, 66.67% accuracy, a repeated
  question with 100% coverage, loading, complete/incomplete identity, 401/403/500,
  no attempts, empty catalog, no available questions, moved/disabled topics and
  navigation.
- Real TanStack QueryClient, QueryObserver and MutationObserver tests exercise
  account/session isolation, cancellation of a late old response, successful
  submit invalidation/refetch and failure without invalidation. All network calls
  in these tests are mocked; no API or Neon request is sent.
- TypeScript source checking includes the new tests and client sources, without
  rewriting cached project-reference declarations.
- Vite production build writes to a new ignored temporary output folder, keeping
  the current application dist intact.

These checks do not replace a real Clerk/browser test or responsive visual review.
The 11 isolated PostgreSQL tests from 5C.2 remain pending, outside this UI phase.
No services, migrations, seeds or database writes are run.

## Manual verification after local startup is approved

1. Sign in and open Dashboard. With the currently confirmed dataset, expect
   3 attempts, 2 correct, 66.67% accuracy and 1 unique historical question.
   Current coverage depends on the current active catalog.
2. Open Topic Map and compare historical counts and coverage with the API.
   Follow a topic practice link and use the existing topic selector.
3. Manually submit an answer, then return to Dashboard/Topic Map without reloading.
   Attempts and accuracy should reflect the server response; repeating a question
   must not increase unique count or coverage beyond 100%.
4. Test a failed submission using browser request blocking. The displayed counters
   must not be optimistically increased.
5. Sign out and switch accounts. Previous metrics and the previous account name
   must not appear while the new session loads.
6. Check narrow mobile and desktop layouts, keyboard links, zero-question topics,
   and the 401/403/500 messages using browser request overrides where available.

Manual submissions are not performed automatically by these tests. Phase 5C.4
requires separate approval.
