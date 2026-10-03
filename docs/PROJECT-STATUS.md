# Project Status

- **Name:** CCNA Learning SaaS
- **Version:** 0.3.0-auth
- **Last updated:** 2026-10-03 (Phase 2 verification run; no code changes)

| Phase | Status |
| --- | --- |
| Phase 0 — Architecture | COMPLETE |
| Phase 1 — Foundation | COMPLETE |
| Phase 2 — Auth, users, roles, authorization | COMPLETE (code + tests + DB + API); NOT FULLY VERIFIED — live Clerk sign-in pending |
| Phase 3 — Topics & question management | NOT STARTED (awaiting approval) |

## Environment configuration (Clerk DEVELOPMENT instance, Neon PostgreSQL)

Values are never recorded here.

| Variable | Status |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Configured (`pk_test_`, public; `artifacts/ccna-learning/.env`) |
| `CLERK_PUBLISHABLE_KEY` | Configured (project secret, `pk_test_`) |
| `CLERK_SECRET_KEY` | Configured (project secret, server-only, `sk_test_` prefix validated) |
| `DATABASE_URL` | Configured 2026-10-03 (project secret, Neon pooled connection) |
| `STRIPE_TEST_API_KEY` | Present but unrelated; not referenced by the app, not used for Clerk |

## Phase 2 verification run (2026-10-03)

| Check | Result |
| --- | --- |
| Frozen install, typecheck, API build | PASS |
| Existing Vitest suite (auth, authz, disabled, role-claim ignored, env) | PASS — 15/15 |
| Migrations against Neon (`migrate`), baseline applied, tables `topics`,`users` | PASS |
| Seed (5 topics) | PASS |
| API starts with real env (startup validator) | PASS |
| `GET /api/healthz`, `/api/topics`, `/api/dashboard/summary` | PASS — 200 |
| `GET /api/auth/me`, `/api/admin/access` without session / with invalid token | PASS — 401 `UNAUTHENTICATED`, no internal details |
| Frontend Clerk initialisation | PASS (2026-10-02) |
| Secret absent from frontend bundle | PASS (2026-10-02) |
| Real Clerk sign-in | NOT TESTED — no real Clerk test account signed in (`users` table has 0 rows) |
| Session `email` claim (live token) | NOT TESTED live (requires real sign-in) |
| Clerk user → `users.clerk_user_id` mapping, first-time creation | NOT TESTED live (unit tests PASS) |
| USER / ADMIN / disabled-account authorization (live) | NOT TESTED live (unit tests PASS) |
| Logout/session behaviour | NOT TESTED |

## Current blockers

1. A real person must sign in once with a real Clerk test account in the preview (no fake users created by the agent).
2. Then promote that account with `promote-admin` for the ADMIN check, and temporarily set `status='DISABLED'` for the disabled-account check.

## Implemented features

- Learner dashboard, topic map, practice entry, admin boundary (Phase 1).
- API: `GET /api/healthz`, `/api/topics`, `/api/dashboard/summary` (public);
  `GET /api/auth/me` (authenticated); `GET /api/admin/access` (ADMIN).
- Clerk sign-in/sign-up pages, provider, server session verification.
- Local user provisioning by `clerk_user_id`; roles USER/ADMIN and status in PostgreSQL.
- Server-side authorization middleware; consistent auth error format.
- Configuration screen when Clerk key missing; API startup env validation.
- First-admin operator script.

## Database state

- Tables: `topics`, `users` (+ enums, indexes). Versioned migrations in `lib/db/drizzle/`
  with an idempotent baseline (see `database/migrations.md`). Seed: 5 demo topics.

## Authentication state

Clerk (ADR-003). No bypass, no fake tokens. Role never taken from token claims.

## Environment variables

```
DATABASE_URL=<your-postgresql-connection-string>
VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
VITE_CLERK_PROXY_URL=<optional>
PORT, BASE_PATH  (supplied by the dev scripts/workflow)
```

## Verification results (2026-10-01, Lovable sandbox, Node 22.22, pnpm 10.28)

| Check | Result |
| --- | --- |
| Clean `pnpm install --frozen-lockfile` | PASS |
| `pnpm run typecheck` | PASS |
| Web build, API build | PASS |
| API tests (`pnpm --filter @workspace/api-server test`) | PASS — 15/15 |
| API refuses start without env, names listed, no values | PASS |
| Migrations: empty DB, push-initialised DB with data, re-run | PASS (data preserved) |
| API startup vs. temp PostgreSQL: healthz/topics/dashboard 200; auth/me and admin/access 401 without session | PASS |
| `promote-admin`: existing user promoted; unknown email refused | PASS |
| Web without key shows configuration screen, no crash | PASS (browser check) |
| Live Clerk sign-in / ADMIN flow | NOT RUN — Clerk keys configured; blocked by `DATABASE_URL` and session `email` claim |

No load, performance or production-readiness testing has been done.

## Next exact step (as of 2026-10-03)

Clerk keys are configured and verified (frontend init, backend config, secret server-only — PASS). Remaining sequence:

1. Configure `DATABASE_URL`.
2. Configure the Clerk session-token `email` claim.
3. Perform real Clerk test-account sign-in.
4. Run the full Phase 2 end-to-end verification.
5. If Phase 2 passes, STOP and wait for explicit approval before Phase 3.
