# Handover

Read `PROJECT-STATUS.md` first, then the latest checkpoint
(`development-log/checkpoints/PHASE-02-CHECKPOINT.md`). Documented ≠ implemented.

## Project

CCNA exam-practice SaaS. Version 0.3.0-auth. Phases 0–1 complete; Phase 2 VERIFIED (2026-10-04); Phase 3 not started.

## Technology (as implemented)

- pnpm workspace; Node >= 22 (Replit used 24); TypeScript 5.9
- Web: React 19 + Vite 7 + Wouter + TanStack Query (`artifacts/ccna-learning`)
- API: Express 5 (`artifacts/api-server`), esbuild bundle
- DB: PostgreSQL + Drizzle ORM (`lib/db`), versioned migrations in `lib/db/drizzle`
- Contracts: OpenAPI (`lib/api-spec`) → Orval → `lib/api-zod`, `lib/api-client-react`
- Auth: Clerk (identity) + `users` table (role/status) — see `development/clerk-setup.md`
- Tests: Vitest in `artifacts/api-server`

## Package management

- **Package manager:** pnpm 10.28.0 (`packageManager` in root `package.json`).
- **Authoritative lockfile:** `pnpm-lock.yaml`. Install: `pnpm install --frozen-lockfile`.
- `node_modules` is never committed; it is rebuilt from the lockfile.

### Lovable preview limitation (platform-specific)

Lovable's sandbox runs its own `bun install` after dependency changes and
regenerates a root `bun.lock`, storing packages under `node_modules/.bun`.
This happened even after `bun.lock` was deleted and pnpm was declared. This
replaced the pnpm store in earlier runs, which is why packages "disappeared".
The project is **not** converted to Bun; `bun.lock` is an artefact of the
Lovable sandbox and should be ignored/deleted on other platforms.

`build:dev` copies `artifacts/ccna-learning/dist/public` to root `dist/` because
Lovable's preview deploys only the root `dist/`. Replit and other hosts use
`artifacts/ccna-learning/dist/public` directly. Root `src/`, `vite.config.ts`,
`bunfig.toml` belong to the Lovable template and are unused by the app.

## Commands

```bash
pnpm install --frozen-lockfile
cp .env.example .env                                   # fill placeholders locally
pnpm --filter @workspace/db run migrate                # create/upgrade schema
pnpm --filter @workspace/scripts run seed              # demo topics (dev only)
pnpm run dev                                           # API :3000 + web :8080
pnpm --filter @workspace/api-server test               # tests
pnpm run typecheck
pnpm run build                                         # production build (all packages)
pnpm --filter @workspace/api-server run start          # production API start
```

Production web: static files from `artifacts/ccna-learning/dist/public` (needs
`PORT` and `BASE_PATH` at build time), `/api` routed to the API server.

## First admin

`pnpm --filter @workspace/scripts run promote-admin -- <email>` after that user signed in once.

## Security

- Admin checks are server-side (`requireAdmin`), role from DB only.
- Secrets only in env/secret stores; API validates env at startup without printing values.
- No auth bypass exists; do not add one without explicit owner approval.

## Next steps (as of 2026-10-03 — superseded: Phase 2 VERIFIED 2026-10-04; Phase 3 awaits owner approval)

Clerk keys are configured and verified (frontend init, backend config, secret server-only — PASS).
The remaining sequence is:

1. Configure `DATABASE_URL`.
2. Configure the Clerk session-token `email` claim (Clerk Dashboard → Sessions → Customize session token; see `development/clerk-setup.md`).
3. Perform a real Clerk test-account sign-in (no fake users, no bypass).
4. Run the full Phase 2 end-to-end verification (user mapping, USER/ADMIN/disabled authorization, logout/session).
5. If Phase 2 passes, update PROJECT-STATUS.md + checkpoint and STOP — Phase 3 starts only on explicit owner approval.

## Disabled-account investigation (2026-10-04)

- Report: after a manual Neon SQL `status=DISABLED`, `/api/auth/me` still returned ACTIVE.
- Code audit: no path sets `users.status` except the insert default for new users; `resolveLocalUser` updates only email/displayName/timestamps; no triggers on `users`; no webhooks/jobs.
- DB target: the running API and the agent use the same `DATABASE_URL` (Neon pooled endpoint `ep-small-moon-…`, database `neondb`).
- Reproduction: agent set the test row to DISABLED; it stayed DISABLED (re-read after 8 s), then was restored to ACTIVE. Nothing reverts it.
- Probable cause: the manual UPDATE ran against a different Neon branch/endpoint than the one in `DATABASE_URL`. No code change made. Tests 15/15 PASS.
- Live disabled 403 and logout 401: NOT VERIFIED (need the user's browser session). Phase 2 NOT VERIFIED at that time (superseded 2026-10-04: VERIFIED).

## Final End-to-End Verification (2026-10-04)

**Phase 2 is VERIFIED. Phase 3 has not started.**

| Check | Result |
| --- | --- |
| Clerk authentication (real test account sign-in) | PASS |
| Local user provisioning (Clerk id → `users.clerk_user_id`, created as USER/ACTIVE) | PASS |
| PostgreSQL role/status enforcement (role/status read from DB, not token) | PASS |
| ADMIN authorization (`promote-admin`, then `/api/admin/access` → `{"allowed":true,"role":"ADMIN"}`) | PASS |
| DISABLED account rejection (ADMIN + DISABLED, live session → `/api/auth/me` 403 `ACCOUNT_DISABLED`); account restored to ACTIVE | PASS |
| Logout → `/api/auth/me` 401 `UNAUTHENTICATED` | PASS |
| Automated auth/authz tests | PASS — 15/15 |

The disabled-account check first appeared inconsistent because the manual SQL update was run
against a different Neon database/endpoint than the application `DATABASE_URL`. This was
investigated and confirmed; no application bug was found and no code changed. The test was
then repeated on the correct endpoint and passed. No load testing or production-readiness
assessment has been performed.

## Phase 3A — Question Domain Foundation (2026-10-05)

COMPLETE for Phase 3A only (schema, migrations, validation, learner read endpoint, tests). Phase 3 is NOT complete;
Phase 3B (admin topic/question management) and later phases have NOT started and await approval.
Details: `development-log/checkpoints/PHASE-03A-CHECKPOINT.md`. DB tests run with `RUN_DB_TESTS=1`.

## Phase 3B-1 — Topic Management API (2026-10-05)

COMPLETE (admin topic list/create/update/disable API only). Question management, UI, practice, attempts and
statistics NOT started. Details: `development-log/checkpoints/PHASE-03B1-CHECKPOINT.md`.
