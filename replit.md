# CCNA Learning SaaS

Foundation workspace for CCNA candidates to browse networking topics and prepare for a future question-practice engine.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/ccna-learning run dev` — run the learner web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed the fictional development topic catalog
- Required env: `DATABASE_URL` — PostgreSQL connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Web: React + Vite + Wouter + TanStack Query

## Where things live

- `artifacts/ccna-learning/` — learner-facing web app and visual language.
- `artifacts/api-server/` — shared Express API.
- `lib/api-spec/openapi.yaml` — source of truth for API contracts.
- `lib/api-client-react/` — generated React Query hooks.
- `lib/api-zod/` — generated server/client validation schemas.
- `lib/db/src/schema/` — Drizzle database schema.
- `scripts/src/seed.ts` — fictional development topic seed.
- `docs/` — portable architecture, handover, security, and phase documentation.

## Architecture decisions

- OpenAPI is authored before generated hooks and server response validation.
- Topic progress fields are API-shaped now, but remain zero until questions and attempts exist.
- The first build uses a relational `topics` table and keeps the API stateless; user data is not held in process memory.
- Authentication and authorization are intentionally not exposed in this foundation build.

## Product

The current learner foundation includes a dashboard, topic map, practice entry state, admin boundary placeholder, live API health status, loading/error/empty states, responsive navigation, and a seeded topic catalog. It is not yet a question engine.

## User preferences

- Keep the product incremental, portable, resource-efficient, and explicitly documented.
- Do not claim features or test coverage that have not been implemented.

## Gotchas

- Run OpenAPI codegen after every `lib/api-spec/openapi.yaml` change.
- The web workflow supplies `PORT` and `BASE_PATH`; direct production builds need those variables explicitly.
- Do not treat zero question counts as missing API data; the question and attempt tables are not implemented yet.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
