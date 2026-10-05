/**
 * Phase 3A database-level tests. Run only when RUN_DB_TESTS=1 and DATABASE_URL
 * are set. Every test runs inside a transaction that is always rolled back, so
 * no rows persist (sequence values may be consumed — gaps are acceptable).
 */
import { describe, expect, it } from "vitest";

const enabled = process.env["RUN_DB_TESTS"] === "1" && !!process.env["DATABASE_URL"];
const ROLLBACK = new Error("rollback");

describe.skipIf(!enabled)("question domain (database)", async () => {
  const { db, pool, topicsTable, questionsTable } = await import("@workspace/db");
  const { createQuestion, getLearnerQuestion, QuestionValidationError } = await import("./questions");
  const { eq, sql } = await import("drizzle-orm");

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
  async function makeTopic(tx: typeof db, status: "ACTIVE" | "DISABLED" = "ACTIVE") {
    const [t] = await tx
      .insert(topicsTable)
      .values({ slug: `p3a-test-${crypto.randomUUID()}`, name: "P3A test", status })
      .returning();
    return t!;
  }
  const input = (topicId: string, extra: Record<string, unknown> = {}) => ({
    topicId,
    text: "Q?",
    type: "MULTIPLE_CHOICE_SINGLE",
    difficulty: "MEDIUM",
    options: [
      { optionKey: "A", text: "a", isCorrect: true },
      { optionKey: "B", text: "b", isCorrect: false },
    ],
    ...extra,
  });

  it("creates a question with a generated, unique CCNA-Q code", async () => {
    await inRollback(async (tx) => {
      const t = await makeTopic(tx);
      const a = await createQuestion(input(t.id), tx);
      const b = await createQuestion(input(t.id), tx);
      expect(a.question.questionCode).toMatch(/^CCNA-Q-\d{6,}$/);
      expect(a.question.questionCode).not.toBe(b.question.questionCode);
      expect(a.options).toHaveLength(2);
    });
  });

  it("enforces questionCode uniqueness at the database", async () => {
    await inRollback(async (tx) => {
      const t = await makeTopic(tx);
      const a = await createQuestion(input(t.id), tx);
      await tx.execute(sql`savepoint s1`);
      await expect(
        tx.execute(sql`insert into questions (question_code, topic_id, text, difficulty)
          values (${a.question.questionCode}, ${t.id}, 'x', 'EASY')`),
      ).rejects.toThrow();
      await tx.execute(sql`rollback to savepoint s1`);
    });
  });

  it("makes questionCode immutable", async () => {
    await inRollback(async (tx) => {
      const t = await makeTopic(tx);
      const a = await createQuestion(input(t.id), tx);
      await tx.execute(sql`savepoint s2`);
      await expect(
        tx.update(questionsTable).set({ questionCode: "CCNA-Q-999999" }).where(eq(questionsTable.id, a.question.id)),
      ).rejects.toThrow();
      await tx.execute(sql`rollback to savepoint s2`);
    });
  });

  it("rejects a non-existent topic (service and foreign key)", async () => {
    await inRollback(async (tx) => {
      const missing = "00000000-0000-4000-8000-000000000000";
      await expect(createQuestion(input(missing), tx)).rejects.toBeInstanceOf(QuestionValidationError);
      await tx.execute(sql`savepoint s3`);
      await expect(
        tx.execute(sql`insert into questions (topic_id, text, difficulty) values (${missing}, 'x', 'EASY')`),
      ).rejects.toThrow();
      await tx.execute(sql`rollback to savepoint s3`);
    });
  });

  it("hides DISABLED questions and questions in DISABLED topics from learners", async () => {
    await inRollback(async (tx) => {
      const t = await makeTopic(tx);
      const active = await createQuestion(input(t.id), tx);
      const disabled = await createQuestion(input(t.id, { status: "DISABLED" }), tx);
      const got = await getLearnerQuestion(active.question.id, tx);
      expect(got?.questionCode).toBe(active.question.questionCode);
      expect(JSON.stringify(got)).not.toContain("isCorrect");
      expect(await getLearnerQuestion(disabled.question.id, tx)).toBeNull();
      const dt = await makeTopic(tx, "DISABLED");
      const inDisabledTopic = await createQuestion(input(dt.id), tx);
      expect(await getLearnerQuestion(inDisabledTopic.question.id, tx)).toBeNull();
    });
  });

  it("closes the pool", async () => {
    await pool.end();
  });
});
