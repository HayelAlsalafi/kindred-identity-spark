# Phase 3A Checkpoint — Question Domain Foundation

**Date:** 2026-10-05 · **Status:** COMPLETE (Phase 3A only). Phase 3 is NOT complete; Phase 3B+ not started.

## Schema (Drizzle: `lib/db/src/schema/questions.ts`)

- Reuses the canonical `topics` table (no second topics table). Users/auth unchanged.
- Enums: `question_type` (`MULTIPLE_CHOICE_SINGLE` only; enum can be extended later),
  `question_difficulty` (`EASY`,`MEDIUM`,`HARD`), `question_status` (`ACTIVE`,`DISABLED`).
- `questions`: `id` uuid PK, `question_code` varchar unique, `topic_id` FK → topics (ON DELETE RESTRICT),
  `text`, `type`, `difficulty`, `explanation`, `image_key` (nullable storage-key abstraction),
  `reference_notes` (nullable), `status`, `created_at`, `updated_at`.
- `question_options`: `id`, `question_id` FK → questions (ON DELETE CASCADE), `option_key`, `display_order`,
  `text`, `is_correct`, timestamps. Unique `(question_id, option_key)` and `(question_id, display_order)`.
- DISABLED = kept in DB, hidden from learners. No hard-delete/soft-delete machinery.

## questionCode strategy

Database-generated: sequence `question_code_seq` + column default
`'CCNA-Q-' || lpad(nextval(...), 6, '0')` (concurrency-safe, never client-generated; widens past 999999).
Uniqueness constraint `questions_question_code_unique`. Immutability: trigger
`questions_question_code_immutable` rejects any UPDATE that changes it. Sequence gaps are acceptable.

## Indexes

`questions_topic_status_idx (topic_id, status)` — topic listing by status (also serves topic_id lookups and the FK);
`questions_status_idx (status)`; unique index on `question_code`; option uniques above. No others.

## Validation

`createQuestionInputSchema` (Zod, existing library) — required fields, type, difficulty, status, uuid topic,
2–10 options, unique option keys, MULTIPLE_CHOICE_SINGLE = exactly one correct option. The single-correct rule is
enforced in the domain layer (not a DB constraint) so future multi-answer types stay possible.
`createQuestion()` (`artifacts/api-server/src/lib/questions.ts`) validates, checks topic existence, inserts
question + options in one transaction. Not exposed over HTTP (admin CRUD is Phase 3B+).

## Migrations

`0001_question_domain.sql` (generated) and `0002_question_code_immutable.sql` (custom trigger). Additive only;
applied to the Neon DB used by the app on 2026-10-05 (existing users/topics data untouched).

## API

`GET /api/questions/{id}` — `requireAuthenticatedUser`; returns only ACTIVE questions in ACTIVE topics,
options without correctness; otherwise 404 `NOT_FOUND`. OpenAPI updated, Zod/client regenerated.
`GET /api/topics` unchanged (`questionCount` still 0 — known limitation).

## Verification (2026-10-05)

| Check | Result |
| --- | --- |
| Migrations on Neon | PASS |
| Existing Phase 2 tests | PASS — 15/15 |
| New validation tests | PASS — 7/7 |
| New DB tests (`RUN_DB_TESTS=1`, transaction rolled back, no rows persisted) | PASS — 6/6 |
| Typecheck, API build, web build | PASS |
| Live HTTP call to `/api/questions/{id}` with a signed-in session | NOT TESTED (no questions exist yet) |
