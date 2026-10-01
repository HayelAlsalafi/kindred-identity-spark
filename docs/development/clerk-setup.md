# Clerk setup

Clerk is the selected authentication provider (ADR-003). Application roles are
stored in PostgreSQL, **not** in Clerk metadata. There is no development bypass:
without valid keys the web app shows an "Authentication is not configured"
screen and the API refuses to start.

## 1. Environment variables (names verified against source)

| Variable | Read in | Side | Required |
| --- | --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | `artifacts/ccna-learning/src/App.tsx` | Browser (public) | Yes |
| `VITE_CLERK_PROXY_URL` | `artifacts/ccna-learning/src/App.tsx` | Browser | No (production proxy only) |
| `CLERK_PUBLISHABLE_KEY` | `artifacts/api-server/src/app.ts` | Server | Yes (validated at startup) |
| `CLERK_SECRET_KEY` | `@clerk/express`, `clerkProxyMiddleware.ts` | Server only | Yes (validated at startup) |

```
VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>   # pk_test_...
CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>        # same pk_test_ value
CLERK_SECRET_KEY=<your-clerk-secret-key>                  # sk_test_..., never in frontend
```

Locally: put them in `.env` (git-ignored). Hosted (Replit/Lovable/other): use the
platform's secrets store. Never commit or paste the secret key.

Startup validation (`artifacts/api-server/src/lib/env.ts`) checks presence and the
`pk_`/`sk_` prefixes and reports variable names only, never values.

Note: `publishableKeyFromHost()` fabricates a `clerk.<host>` key when given no key.
The web app now only calls it when `VITE_CLERK_PUBLISHABLE_KEY` is set, so a
missing key is reported instead of silently producing a fake key.

## 2. Required session-token claims

`resolveLocalUser` (`artifacts/api-server/src/middlewares/auth.ts`) reads these
claims from the Clerk session token:

| Claim | Required | Missing → |
| --- | --- | --- |
| `email` | Yes | 401 `UNAUTHENTICATED` |
| `firstName`, `lastName` | No | display name falls back to email prefix |

Clerk does not include these by default. In the Clerk Dashboard →
**Sessions → Customize session token**, add:

```json
{
  "email": "{{user.primary_email_address}}",
  "firstName": "{{user.first_name}}",
  "lastName": "{{user.last_name}}"
}
```

Never add a `role` claim expecting it to grant access — the API ignores it;
role always comes from the `users` table (covered by a test).

## 3. Flow

```text
Browser (ClerkProvider, /sign-in, /sign-up)
  -> Clerk session cookie, same-origin /api requests
API clerkMiddleware -> getAuth(req).userId
  -> users row by clerk_user_id (created lazily on first call, role USER)
  -> status ACTIVE? else 403 ACCOUNT_DISABLED
  -> requireAdmin: role ADMIN? else 403 FORBIDDEN
```

Endpoints: `GET /api/auth/me` (authenticated), `GET /api/admin/access` (ADMIN).

## 4. First admin

No user is ever promoted automatically and no admin email is hard-coded.

1. The person signs in once through the app (creates their `users` row as USER).
2. An operator with direct database access runs:
   ```bash
   DATABASE_URL=<connection-string> pnpm --filter @workspace/scripts run promote-admin -- person@example.com
   ```
   Revert with `--demote`. There is deliberately no HTTP endpoint for this.

## 5. Not implemented (known gaps)

- Clerk webhooks (user updates/deletions are not synced; provisioning is lazy).
- Admin UI for role management (Phase 6).
- End-to-end sign-in test against a real Clerk instance (needs real keys).
