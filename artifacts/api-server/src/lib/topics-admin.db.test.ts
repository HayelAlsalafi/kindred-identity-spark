/**
 * Phase 3B-1 database tests for the admin topic service. Run only with
 * RUN_DB_TESTS=1 + DATABASE_URL; every test runs in a rolled-back transaction.
 */
import { describe, expect, it } from "vitest";

const enabled = process.env["RUN_DB_TESTS"] === "1" && !!process.env["DATABASE_URL"];
const ROLLBACK = new Error("rollback");
describe("admin topic service (database)", async () => {
  if (!enabled) {
    it.skip("requires RUN_DB_TESTS=1 and DATABASE_URL", () => {});
    return;
  }
  const { db, pool, topicsTable } = await import("@workspace/db");
  const svc = await import("./topics-admin");
  const { eq } = await import("drizzle-orm");

  async function inRollback(fn: (tx: typeof db) => Promise<void>) {
    await db
      .transaction(async (tx) => {
        await fn(tx as unknown as typeof db);
        throw ROLLBACK;
      })
      .catch((e) => {
        if (e !== ROLLBACK) throw e;
      });
  }
  const slug = () => `p3b1-${crypto.randomUUID().slice(0, 8)}`;

  it("creates, lists, updates and disables a topic", async () => {
    await inRollback(async (tx) => {
      const t = await svc.createTopic({ slug: slug(), name: "  Test  ", displayOrder: 3 }, tx);
      expect(t.name).toBe("Test");
      expect(t.status).toBe("ACTIVE");
      expect((await svc.listAllTopics(tx)).some((x) => x.id === t.id)).toBe(true);
      const u = await svc.updateTopic(t.id, { name: "Renamed" }, tx);
      expect(u.name).toBe("Renamed");
      const d = await svc.disableTopic(t.id, tx);
      expect(d.status).toBe("DISABLED");
      const [row] = await tx.select().from(topicsTable).where(eq(topicsTable.id, t.id));
      expect(row?.status).toBe("DISABLED"); // kept, not deleted
      expect((await svc.listAllTopics(tx)).some((x) => x.id === t.id)).toBe(true);
    });
  });

  it("rejects invalid data", async () => {
    await inRollback(async (tx) => {
      for (const bad of [
        {},
        { slug: "x", name: "" },
        { slug: "Bad Slug!", name: "A" },
        { slug: "ok-slug", name: "A", status: "GONE" },
        { slug: "ok-slug", name: "A", extra: 1 },
      ]) {
        await expect(svc.createTopic(bad, tx)).rejects.toMatchObject({ status: 400 });
      }
      const t = await svc.createTopic({ slug: slug(), name: "A" }, tx);
      await expect(svc.updateTopic(t.id, {}, tx)).rejects.toMatchObject({ status: 400 });
    });
  });

  it("rejects duplicate slugs on create and update (409)", async () => {
    await inRollback(async (tx) => {
      const s = slug();
      const a = await svc.createTopic({ slug: s, name: "A" }, tx);
      await expect(svc.createTopic({ slug: s.toUpperCase(), name: "B" }, tx)).rejects.toMatchObject(
        { status: 409 },
      );
      const b = await svc.createTopic({ slug: slug(), name: "B" }, tx);
      await expect(svc.updateTopic(b.id, { slug: a.slug }, tx)).rejects.toMatchObject({
        status: 409,
      });
      expect((await svc.updateTopic(a.id, { slug: a.slug }, tx)).slug).toBe(a.slug); // same row OK
    });
  });

  it("returns 404 for unknown ids", async () => {
    await inRollback(async (tx) => {
      const missing = "00000000-0000-4000-8000-000000000000";
      await expect(svc.updateTopic(missing, { name: "x" }, tx)).rejects.toMatchObject({
        status: 404,
      });
      await expect(svc.disableTopic(missing, tx)).rejects.toMatchObject({ status: 404 });
    });
  });

  it("closes the pool", async () => {
    await pool.end();
  });
});
