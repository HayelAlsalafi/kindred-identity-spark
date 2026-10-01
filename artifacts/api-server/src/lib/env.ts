/**
 * Startup environment validation. Reports variable NAMES only — never values.
 * There is intentionally no fallback or "auth disabled" mode: if Clerk or the
 * database is not configured, the API refuses to start with a clear message.
 */
export interface EnvCheckResult {
  missing: string[];
  invalid: string[];
}

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvCheckResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const has = (name: string) => typeof env[name] === "string" && env[name]!.trim() !== "";

  for (const name of ["PORT", "DATABASE_URL", "CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"]) {
    if (!has(name)) missing.push(name);
  }

  if (has("PORT")) {
    const port = Number(env["PORT"]);
    if (!Number.isInteger(port) || port <= 0) invalid.push("PORT (must be a positive integer)");
  }
  if (has("CLERK_PUBLISHABLE_KEY") && !/^pk_(test|live)_/.test(env["CLERK_PUBLISHABLE_KEY"]!)) {
    invalid.push("CLERK_PUBLISHABLE_KEY (must start with pk_test_ or pk_live_)");
  }
  if (has("CLERK_SECRET_KEY") && !/^sk_(test|live)_/.test(env["CLERK_SECRET_KEY"]!)) {
    invalid.push("CLERK_SECRET_KEY (must start with sk_test_ or sk_live_)");
  }
  if (has("DATABASE_URL") && !/^postgres(ql)?:\/\//.test(env["DATABASE_URL"]!)) {
    invalid.push("DATABASE_URL (must be a postgres:// or postgresql:// URL)");
  }

  return { missing, invalid };
}

export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const { missing, invalid } = checkEnv(env);
  if (missing.length || invalid.length) {
    const lines = [
      "API server configuration is incomplete.",
      ...missing.map((n) => `  missing: ${n}`),
      ...invalid.map((n) => `  invalid: ${n}`),
      "See .env.example and docs/development/clerk-setup.md.",
    ];
    throw new Error(lines.join("\n"));
  }
}
