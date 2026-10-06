# Phase 3B-1 Checkpoint — Topic Management API

**Date:** 2026-10-05 · **Status:** COMPLETE (3B-1 only). No UI, no question management, no practice/attempts/statistics.

## Endpoints (all `requireAuthenticatedUser` + `requireAdmin`, role from PostgreSQL)

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/admin/topics` | All topics incl. DISABLED |
| POST | `/api/admin/topics` | 201 created · 400 `VALIDATION_ERROR` · 409 `CONFLICT` (slug) |
| PATCH | `/api/admin/topics/{id}` | 200 · 400 · 404 `NOT_FOUND` · 409 |
| POST | `/api/admin/topics/{id}/disable` | 200 status DISABLED (row kept) · 404 |

No hard delete. Learner `GET /api/topics` and `/api/dashboard/summary` unchanged — still ACTIVE only.

## Validation (`lib/db/src/schema/topics.ts`, Zod)

slug lowercase `a-z0-9` with single hyphens, 2–120 chars (normalised to lowercase); name 1–180;
description ≤ 2000; displayOrder integer 0–100000; status ACTIVE/DISABLED; unknown fields rejected;
update needs ≥ 1 field. Duplicate slug: pre-check plus DB unique constraint → 409.

## Files

`artifacts/api-server/src/lib/topics-admin.ts`, `src/routes/admin-topics.ts`, `src/routes/index.ts`,
`lib/db/src/schema/topics.ts`, `lib/api-spec/openapi.yaml` + regenerated `lib/api-zod`/`lib/api-client-react`,
`lib/api-client-react/tsconfig.json` (added `dom.iterable`, required by regenerated client), tests below.

## Verification (2026-10-05)

| Check | Result |
| --- | --- |
| `routes/admin-topics.test.ts` (real auth middleware; 401/403 USER/403 disabled on all 4 routes, CRUD, error mapping, no leak) | PASS 16/16 |
| `lib/topics-admin.db.test.ts` (Neon, rolled back: create/list/update/disable, invalid data, duplicate slug, 404) | PASS 5/5 |
| All tests (`RUN_DB_TESTS=1`) | PASS 49/49 |
| Typecheck, API build, web build | PASS |
| Live HTTP call with real ADMIN session | NOT TESTED |
