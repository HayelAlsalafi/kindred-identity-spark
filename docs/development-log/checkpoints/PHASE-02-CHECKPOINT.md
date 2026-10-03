# Phase 2 Checkpoint — Authentication, Users, Roles, Authorization

**Date:** 2026-10-01 · **Status:** COMPLETE in code + tests; live sign-in, user mapping and authorization not yet verified (blocked by `DATABASE_URL` and the session `email` claim; Clerk keys configured).

## Already present when the project was imported (Replit)

- Clerk packages, `clerkMiddleware`, production Clerk proxy.
- `users` table (clerk_user_id, email, role USER/ADMIN, status ACTIVE/DISABLED).
- `resolveLocalUser`, `requireAuthenticatedUser`, `requireAdmin`, `/api/auth/me`, `/api/admin/access`.
- Sign-in/sign-up page components and admin boundary UI.

## Completed in this checkpoint

- **Bug fixed:** `ClerkProvider` was imported but never mounted and `/sign-in`, `/sign-up`
  had no routes — Clerk hooks could not work. Provider and routes now wired.
- **Bug fixed:** `publishableKeyFromHost()` silently fabricated a key when none was set.
- Clear "Authentication is not configured" screen when the web key is missing (no bypass).
- API startup environment validation (names only, never values).
- 15 Vitest tests: authentication (401, missing email claim, provisioning as USER,
  disabled 403, no error leakage, safe user shape) and authorization (401, USER 403,
  ADMIN allowed, role claim in token ignored) plus env validation.
- `promote-admin` operator script for first-admin bootstrap.
- Versioned migrations with an idempotent baseline.
- Package manager declared (pnpm 10.28.0, Node >= 22), runtime reinstall workaround removed,
  missing `drizzle-orm` dependency declared in `scripts`.

## Verification

See PROJECT-STATUS.md → Verification results.

## Environment configuration (2026-10-02)

Clerk development instance. Publishable key configured for web and API; frontend
Clerk initialisation PASS; no secret in frontend bundle. `CLERK_SECRET_KEY` configured and validated (server-only).
`DATABASE_URL` still missing, so backend, sign-in, user mapping and admin checks are
not yet tested. `STRIPE_TEST_API_KEY` is unrelated and not used. Details:
PROJECT-STATUS.md.

## Remaining

- `DATABASE_URL`, session-token `email` claim, then real sign-in / admin check.
- Lovable preview regenerates `bun.lock` (platform behaviour, see HANDOVER).

## Verification run (2026-10-03)

`DATABASE_URL` configured (Neon, project secret). PASS: install, typecheck, API build,
15/15 tests, migrations + seed on Neon, API startup, public endpoints 200, protected
endpoints 401 without/invalid session. NOT TESTED: live Clerk sign-in, live email claim,
`clerk_user_id` mapping, live USER/ADMIN/disabled checks, logout — no real test account
has signed in yet (0 users). Phase 2 is NOT marked VERIFIED. Phase 3 not started.
