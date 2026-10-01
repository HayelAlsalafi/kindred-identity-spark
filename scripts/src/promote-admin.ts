/**
 * Controlled first-admin bootstrap.
 *
 * Usage (operator with direct DATABASE_URL access only):
 *   pnpm --filter @workspace/scripts run promote-admin -- user@example.com
 *   pnpm --filter @workspace/scripts run promote-admin -- user@example.com --demote
 *
 * Rules:
 * - The person must have signed in once through Clerk so their local user row exists.
 * - No email is hard-coded; nothing is promoted automatically.
 * - Runs only from a trusted shell — there is no HTTP endpoint for this.
 */
import { eq } from "drizzle-orm";
import { db, pool, usersTable } from "@workspace/db";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const demote = args.includes("--demote");
  const email = args.find((a) => !a.startsWith("--"))?.trim();

  if (!email || !email.includes("@")) {
    console.error("Usage: promote-admin <email> [--demote]");
    process.exitCode = 1;
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    console.error(`No local user with email ${email}. They must sign in once through the app first.`);
    process.exitCode = 1;
    return;
  }

  const role = demote ? "USER" : "ADMIN";
  if (user.role === role) {
    console.log(`${email} already has role ${role}. No change.`);
    return;
  }

  await db.update(usersTable).set({ role, updatedAt: new Date() }).where(eq(usersTable.id, user.id));
  console.log(`${email}: ${user.role} -> ${role}`);
}

main()
  .catch((err) => {
    console.error("promote-admin failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
