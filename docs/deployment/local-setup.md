# Local Setup

Requirements: Node.js >= 22, pnpm 10.28 (`corepack enable`), PostgreSQL, git.

```bash
git clone <repository-url> && cd CCNA-SaaS
pnpm install --frozen-lockfile
cp .env.example .env        # fill DATABASE_URL and Clerk placeholders (never commit .env)
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/scripts run seed
pnpm run dev                # API on :3000, web on :8080 (proxies /api)
```

Checks: `pnpm run typecheck`, `pnpm --filter @workspace/api-server test`, `pnpm run build`.
Clerk configuration: `docs/development/clerk-setup.md`. Migrations: `docs/database/migrations.md`.
