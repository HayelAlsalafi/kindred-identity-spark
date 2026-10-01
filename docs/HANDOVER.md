# Handover

Read `PROJECT-STATUS.md` first, then the latest checkpoint
(`development-log/checkpoints/PHASE-02-CHECKPOINT.md`). Documented ≠ implemented.

## Project

CCNA exam-practice SaaS. Version 0.3.0-auth. Phases 0–2 complete; Phase 3 not started.

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

## Next steps

Configure Clerk keys → verify live sign-in → Phase 3 (needs approval).
