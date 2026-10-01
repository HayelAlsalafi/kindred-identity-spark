# PHASE-01-CHECKPOINT

## Phase

Project Foundation

## Date

2026-09-26

## Objective

تحويل التصميم المعماري إلى foundation قابلة للتشغيل مع عقد API، قاعدة بيانات أولية، وواجهة learner مرتبطة ببيانات حقيقية.

## What was implemented

- أُنشئ artifact ويب React/Vite في الجذر.
- توسع OpenAPI ليشمل `GET /healthz`, `GET /topics`, و`GET /dashboard/summary`.
- شُغّل codegen وأُضيفت hooks وZod schemas المولدة.
- أُنشئ جدول `topics` في Drizzle/PostgreSQL مع status/order index.
- أُضيفت routes تقرأ active topics وتبني summary من قاعدة البيانات.
- أُضيف seed script بخمس topics fictional.
- أُنشئت صفحات dashboard وtopic map وpractice entry وadmin boundary.
- أُضيفت حالات loading/error/empty وhealth status وتنقل responsive.

## Files created or modified

- `artifacts/ccna-learning/`
- `artifacts/api-server/src/routes/learning.ts`
- `lib/api-spec/openapi.yaml`
- `lib/db/src/schema/topics.ts`
- `scripts/src/seed.ts`
- generated files under `lib/api-client-react/` and `lib/api-zod/`
- `scripts/package.json`, `scripts/tsconfig.json`, `.env.example`, `replit.md`
- project status, changelog, and this checkpoint

## Database changes

- Applied `topics` table to development PostgreSQL.
- Seeded 5 active topics.
- No users, roles, questions, question options, attempts, or images yet.

## API changes

- `GET /api/healthz` returns `{ "status": "ok" }`.
- `GET /api/topics` returns active topic summaries.
- `GET /api/dashboard/summary` returns current foundation totals and focus topic.

## Authentication changes

- None. The admin page has no privileged actions and does not grant access.

## Frontend changes

- Added live dashboard and topic catalog.
- Added practice entry state and admin boundary state.
- Added responsive navigation and clear loading/error/empty branches.

## Backend changes

- Added database-backed learning routes with generated response validation.
- Kept application state out of process memory.

## Tests and verification

- `pnpm --filter @workspace/api-spec run codegen`
- `pnpm run typecheck`
- `pnpm --filter @workspace/ccna-learning run typecheck`
- `curl http://localhost:80/api/healthz`
- `curl http://localhost:80/api/topics`
- `curl http://localhost:80/api/dashboard/summary`
- Browser preview screenshot at desktop viewport

## Results

All listed checks passed. No automated feature suite or E2E suite exists yet.

## Known issues

- Progress values are intentionally zero because the question and attempt models are not implemented.
- No authentication, authorization, or real admin tools.
- No production deployment or load testing.

## Remaining work

- Choose and integrate the approved authentication provider.
- Add users/roles and server-side authorization.
- Add questions/options and admin content management.
- Add practice submission, timer timestamps, attempts, and statistics.

## Next phase

Phase 2 — Database & Authentication

## Commands

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/ccna-learning run dev
pnpm run typecheck
```

## Environment

`DATABASE_URL` is required for the API and seed command. `PORT` and `BASE_PATH` are supplied by artifact workflows; direct Vite builds need them explicitly.