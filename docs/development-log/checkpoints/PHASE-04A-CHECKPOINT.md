# Phase 4A Checkpoint — Practice API Foundation

**Date:** 2026-10-07  
**Status:** COMPLETE AND RUNTIME VERIFIED

Phase 4A establishes the authenticated learner Practice API and the answer-safety boundary. It intentionally does not implement the learner Practice UI, attempt persistence, statistics, or analytics.

## Delivered scope

- `GET /api/practice/topics/{topicId}/question`: authenticated ACTIVE user; one ACTIVE question from an ACTIVE topic; allow-listed learner fields only; no answer/explanation/reference-note leakage.
- `POST /api/practice/questions/{questionId}/answer`: validates question/topic ACTIVE state and that the option belongs to the question; grades server-side; only then returns `isCorrect`, correct option, and explanation; unknown options return `400 INVALID_OPTION`.
- OpenAPI and generated client/schema artifacts updated with separate pre-submit and post-submit DTOs.
- Focused route and database integration tests added.
- Existing schema/auth reused; no database migration required.

## Verification

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | PASS |
| Full project typecheck | PASS |
| Non-DB API Vitest suite | PASS — 65/65 |
| API production build | PASS |
| Learner production build | PASS |
| Auth required | PASS — automated |
| Pre-submit answer leakage protection | PASS — automated + runtime |
| Server-side grading | PASS — runtime |
| Unknown option rejected | PASS — runtime, `400 INVALID_OPTION` |
| Disabled question/topic protection | PASS — automated |

## Runtime verification

Runtime verification used existing `CCNA-Q-000041` in Networking Fundamentals. It was temporarily changed from DISABLED to ACTIVE and returned to DISABLED afterward. The pre-submit request returned HTTP 200 with question/options and no answer-revealing fields. Submitting option A returned HTTP 200 with `isCorrect: false`, correct option C (Network), and explanation. Submitting option Z returned HTTP 400 with `INVALID_OPTION`.

## Database integration-test note

Phase 4A DB integration cases are present in `questions.db.test.ts`, including answer-free payloads, grading, invalid options, and disabled question/topic behavior. In the final local attempt, Vitest stopped before collecting tests because the shell invocation did not make `DATABASE_URL` available to the test process. This checkpoint therefore does not claim that DB suite passed in that run. The observed failure was environment invocation, not a failed assertion.

## Review notes

The implementation was reviewed after push to the Phase 4A branch. The pre-submit path uses explicit field selection/allow-listing, and the answer path validates against options belonging to the requested question. PostgreSQL `random()` selection is acceptable for the current dataset; it can be revisited during later performance work if the bank becomes large.

## Scope boundary

Phase 4A does NOT include learner Practice UI, attempt/history persistence, learner statistics, admin analytics, load testing, or production-readiness validation. No scalability claim is made.

## Next step

**Phase 4B — Learner Practice UI** using the verified Phase 4A API contract. Attempt history and statistics remain Phase 5 scope.
