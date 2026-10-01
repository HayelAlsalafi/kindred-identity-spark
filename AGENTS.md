<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- pnpm workspace with `pnpm-lock.yaml` as the only authoritative lockfile — deterministic installs; `bun.lock` is a Lovable sandbox artefact.
- Clerk for identity, roles/status in PostgreSQL `users` — role never read from token claims, so authorization stays server-controlled.
- No authentication bypass or fake tokens — hides real auth problems; owner approval required.
- Schema changes via versioned Drizzle migrations in `lib/db/drizzle` (`migrate`), not `push` — portable, data-safe upgrades.
- API validates required env at startup (`src/lib/env.ts`), reporting names only — fail fast without leaking secrets.
- Root `build:dev` copies the web build to `dist/` — Lovable preview only deploys root `dist/`.
