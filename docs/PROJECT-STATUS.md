# Project Status

- **Name:** CCNA Learning SaaS
- **Version:** 0.3.0-auth
- **Last updated:** 2026-10-01

| Phase | Status |
| --- | --- |
| Phase 0 — Architecture | COMPLETE |
| Phase 1 — Foundation | COMPLETE |
| Phase 2 — Auth, users, roles, authorization | COMPLETE (code + tests); live Clerk sign-in unverified |
| Phase 3 — Topics & question management | NOT STARTED (awaiting approval) |

## Environment configuration (2026-10-02, Clerk DEVELOPMENT instance)

Values are never recorded here.

| Variable | Status |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Configured (`pk_test_`, public; `artifacts/ccna-learning/.env`) |
| `CLERK_PUBLISHABLE_KEY` | Configured (project secret, `pk_test_`) |
| `CLERK_SECRET_KEY` | Configured (project secret, server-only, `sk_test_` prefix validated) |
| `DATABASE_URL` | MISSING (external dependency) |
| `STRIPE_TEST_API_KEY` | Present but unrelated; not referenced by the app, not used for Clerk |

| Check | Result |
| --- | --- |
| Frontend Clerk initialisation (config screen gone, `/sign-in` renders Clerk dev UI) | PASS |
| `CLERK_SECRET_KEY` / `sk_` / Stripe key absent from frontend bundle | PASS (only the variable *name* appears in config-screen text) |
| Backend Clerk configuration (startup validator) | PASS for Clerk vars; API still refuses to start because `DATABASE_URL` is missing |
| Real Clerk sign-in (end to end with API) | NOT TESTED |
| Clerk user → `users.clerk_user_id` mapping | NOT TESTED |
| ADMIN authorization | NOT TESTED |

## Current blockers

1. `DATABASE_URL` not configured.
2. Clerk session token `email` claim must be added in the Clerk Dashboard.
3. A real Clerk test account must sign in (no fake users).

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
| Live Clerk sign-in / ADMIN flow | NOT RUN — no keys |

No load, performance or production-readiness testing has been done.

## Next exact step

1. Configure Clerk keys and session-token claims; sign in; run `promote-admin`; confirm `/admin`.
2. On approval, start Phase 3.
