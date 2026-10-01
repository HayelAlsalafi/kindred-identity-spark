# Clerk development setup

Clerk is the selected authentication provider (see
`docs/decisions/ADR-003-session-authentication.md`). It is partially
implemented; this document describes the configuration needed to run it.

## Where Clerk is integrated

### Web app (`artifacts/ccna-learning`)

- `src/App.tsx`
  - `ClerkProvider` wraps the app with the `shadcn` theme from `@clerk/themes`.
  - The publishable key comes from `publishableKeyFromHost(hostname, VITE_CLERK_PUBLISHABLE_KEY)`
    (`@clerk/react/internal`), so a key is required even in development —
    the app throws `Missing VITE_CLERK_PUBLISHABLE_KEY in .env file` without it.
  - `SignIn` / `SignUp` components from `@clerk/react` render the auth pages.
  - `useAuth`, `useUser`, `useClerk` drive the sidebar auth panel and route
    guards (practice and admin surfaces redirect signed-out users).
  - `VITE_CLERK_PROXY_URL` is optional and only relevant in production.

### API server (`artifacts/api-server`)

- `src/app.ts`
  - `clerkMiddleware` from `@clerk/express` is mounted globally; its
    publishable key is derived from the request host or `CLERK_PUBLISHABLE_KEY`.
  - `clerkProxyMiddleware` proxies `/api/__clerk` to Clerk's Frontend API in
    production only (no-op in development, and a no-op without
    `CLERK_SECRET_KEY`).
- `src/middlewares/auth.ts`
  - `resolveLocalUser` reads the session via `getAuth(request)`, then
    provisions/updates the matching row in the `users` table
    (`clerk_user_id`, email, display name, role, status, last login).
  - `requireAuthenticatedUser` returns 401/403 for unauthenticated or
    disabled accounts; `requireAdmin` enforces the `ADMIN` role server-side.

### Database (`lib/db/src/schema/users.ts`)

- `users` table keyed by unique `clerk_user_id`, with `USER`/`ADMIN` role
  and `ACTIVE`/`DISABLED` status enums.

## Required environment variables

| Variable | Used by | Required |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | API server (`@clerk/express`, production proxy) | Yes for authenticated API calls |
| `CLERK_PUBLISHABLE_KEY` | API server (`clerkMiddleware`) | Yes |
| `VITE_CLERK_PUBLISHABLE_KEY` | Web app (`ClerkProvider`) | Yes — app will not start without it |
| `VITE_CLERK_PROXY_URL` | Web app | No — production proxy only |

Copy `.env.example` to `.env` and fill in the development-instance keys from
the Clerk dashboard (API Keys page). Never commit real keys.

## Current state

- Implemented: provider selection, middleware wiring, sign-in/sign-up UI,
  server-side session resolution, local user provisioning, role/status
  enforcement helpers (`requireAuthenticatedUser`, `requireAdmin`).
- Missing: Clerk credentials in the environment (blocked until keys are
  added), webhook-based user sync (users are provisioned lazily on first
  authenticated request instead), and automated tests for the auth flows.
- The public surfaces (dashboard, topic map, health) work without Clerk;
  sign-in, practice, and admin surfaces require valid keys.
