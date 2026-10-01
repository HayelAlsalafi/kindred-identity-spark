# Phase 2 Checkpoint — Authentication, Users, Roles, Authorization

**Date:** 2026-10-01 · **Status:** COMPLETE in code; live Clerk sign-in not yet verified (needs real keys).

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

## Remaining

- Real Clerk keys + session-token claims, then a manual sign-in / admin check.
- Lovable preview regenerates `bun.lock` (platform behaviour, see HANDOVER).
