import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the real schemas without creating a PostgreSQL pool.
vi.mock("@workspace/db", async () => ({
  ...await import("@workspace/db/schema"),
  db: {},
}));

const { submitPracticeAnswer } = await import("./practice");
type Db = Parameters<typeof submitPracticeAnswer>[3];
const questionId = "11111111-1111-4111-8111-111111111111";
const topicId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const options = [
  { optionKey: "A", text: "Incorrect", isCorrect: false },
  { optionKey: "B", text: "Correct", isCorrect: true },
];

function makeDb({
  missing = false,
  answerOptions = options,
  failInsert = false,
  failCommit = false,
} = {}) {
  const rows: Record<string, unknown>[] = [];
  const locks = vi.fn();
  const insert = vi.fn();
  const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const pending: Record<string, unknown>[] = [];
    let reads = 0;
    const tx = {
      select: () => {
        const result = reads++ === 0
          ? (missing ? [] : [{ question: { id: questionId, topicId, explanation: "Because B." } }])
          : answerOptions;
        const query = {
          from: () => query,
          innerJoin: () => query,
          where: () => query,
          limit: () => query,
          orderBy: () => query,
          for: (mode: string) => {
            locks(mode);
            return Promise.resolve(result);
          },
        };
        return query;
      },
      insert: (table: unknown) => {
        insert(table);
        return {
          values: async (value: Record<string, unknown>) => {
            if (failInsert) throw new Error("Insert failed");
            pending.push(value);
          },
        };
      },
    };
    const result = await fn(tx);
    if (failCommit) throw new Error("Commit failed");
    rows.push(...pending);
    return result;
  });
  return { db: { transaction } as unknown as Db, rows, transaction, insert, locks };
}

describe("practice attempt persistence (unit)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([["A", false], ["B", true]] as const)(
    "persists server-graded option %s before returning unchanged feedback",
    async (key, correct) => {
      const fake = makeDb();
      const result = await submitPracticeAnswer(questionId, key, userId, fake.db);
      expect(result).toEqual({
        isCorrect: correct,
        correctOption: { optionKey: "B", text: "Correct" },
        explanation: "Because B.",
      });
      expect(fake.rows).toEqual([{
        userId, questionId, topicId, selectedOptionKey: key, isCorrect: correct,
      }]);
      expect(fake.transaction).toHaveBeenCalledOnce();
      expect(fake.locks.mock.calls).toEqual([["share"], ["share"]]);
    },
  );

  it("normalizes the selected key and allows repeated attempts", async () => {
    const fake = makeDb();
    await submitPracticeAnswer(questionId, " b ", userId, fake.db);
    await submitPracticeAnswer(questionId, "B", userId, fake.db);
    expect(fake.rows).toHaveLength(2);
    expect(fake.rows.every((row) => row.selectedOptionKey === "B")).toBe(true);
  });

  it("associates attempts only with the supplied server-side internal user", async () => {
    const fake = makeDb();
    const otherUserId = "44444444-4444-4444-8444-444444444444";
    await submitPracticeAnswer(questionId, "A", userId, fake.db);
    await submitPracticeAnswer(questionId, "B", otherUserId, fake.db);
    expect(fake.rows.map((row) => row.userId)).toEqual([userId, otherUserId]);
  });

  it("does not insert when the active question/topic lookup fails", async () => {
    const fake = makeDb({ missing: true });
    expect(await submitPracticeAnswer(questionId, "A", userId, fake.db)).toBeNull();
    expect(fake.insert).not.toHaveBeenCalled();
  });

  it("does not insert invalid options", async () => {
    const fake = makeDb();
    await expect(submitPracticeAnswer(questionId, "Z", userId, fake.db)).rejects.toMatchObject({
      status: 400, code: "INVALID_OPTION",
    });
    expect(fake.insert).not.toHaveBeenCalled();
  });

  it.each([
    options.map((option) => ({ ...option, isCorrect: false })),
    options.map((option) => ({ ...option, isCorrect: true })),
  ])("does not insert when the correct-answer data is inconsistent", async (answerOptions) => {
    const fake = makeDb({ answerOptions });
    await expect(submitPracticeAnswer(questionId, "A", userId, fake.db)).rejects.toMatchObject({
      status: 500, code: "INTERNAL_ERROR",
    });
    expect(fake.insert).not.toHaveBeenCalled();
  });

  it.each(["insert", "commit"])("propagates %s failure without a successful attempt", async (failure) => {
    const fake = makeDb({ failInsert: failure === "insert", failCommit: failure === "commit" });
    await expect(submitPracticeAnswer(questionId, "B", userId, fake.db)).rejects.toThrow();
    expect(fake.rows).toEqual([]);
  });
});
