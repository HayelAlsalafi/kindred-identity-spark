import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolClient } from "pg";
import { eq } from "drizzle-orm";
import { GetLearningProgressResponse } from "@workspace/api-zod";
import { practiceAttemptsTable } from "@workspace/db/schema";

// No default application pool can connect to an inherited DATABASE_URL.
vi.mock("@workspace/db", async () => ({
  ...(await import("@workspace/db/schema")),
  db: undefined,
}));
const { getLearningProgress } = await import("./learning-progress");

const testUrl = process.env["LEARNING_PROGRESS_TEST_DATABASE_URL"];
function validateLocalTestUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid dedicated local test database configuration.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    !/^\/ccna_progress_test(?:_[a-z0-9]+)?$/.test(url.pathname) ||
    url.searchParams.size !== 0
  ) {
    throw new Error(
      "Learning progress tests require a dedicated loopback ccna_progress_test database.",
    );
  }
}
// Reject unsafe URLs even when the suite would otherwise be skipped.
if (testUrl) validateLocalTestUrl(testUrl);

describe.skipIf(!testUrl)("learning progress isolated PostgreSQL", () => {
  let pool: Pool;
  let client: PoolClient;
  let db: NodePgDatabase;
  const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const userA = "aaaaaaaa-1111-4111-8111-111111111111";
  const userB = "bbbbbbbb-1111-4111-8111-111111111111";
  const q1 = "11111111-1111-4111-8111-111111111111";
  const q2 = "22222222-2222-4222-8222-222222222222";
  const q3 = "33333333-3333-4333-8333-333333333333";

  beforeAll(async () => {
    pool = new Pool({ connectionString: testUrl, max: 1, connectionTimeoutMillis: 5000 });
    client = await pool.connect();
    const identity = await client.query(`
      SELECT current_database() AS database,
        host(inet_server_addr()) AS address,
        current_setting('neon.branch_id', true) AS neon_branch
    `);
    expect(identity.rows[0].database).toMatch(/^ccna_progress_test(?:_[a-z0-9]+)?$/);
    expect(["127.0.0.1", "::1"]).toContain(identity.rows[0].address);
    expect(identity.rows[0].neon_branch || null).toBeNull();
    db = drizzle(client);

    // Fixtures are session-local TEMP tables, never migrations or seeds.
    // Preserve application column types and relevant foreign-key constraints.
    await client.query(`
      CREATE TEMP TABLE users (id uuid PRIMARY KEY);
      CREATE TEMP TABLE topics (
        id uuid PRIMARY KEY, name varchar(180) NOT NULL,
        status text NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
        display_order integer NOT NULL
      );
      CREATE TEMP TABLE questions (
        id uuid PRIMARY KEY, topic_id uuid NOT NULL REFERENCES topics(id),
        status text NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED'))
      );
      CREATE TEMP TABLE practice_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        question_id uuid NOT NULL REFERENCES questions(id),
        topic_id uuid NOT NULL REFERENCES topics(id),
        is_correct boolean NOT NULL,
        selected_option_key varchar(8) NOT NULL DEFAULT 'A',
        submitted_at timestamptz NOT NULL DEFAULT now()
      );
    `);
  });
  afterAll(async () => {
    client?.release();
    await pool?.end();
  });
  beforeEach(async () => {
    await client.query(
      "TRUNCATE pg_temp.practice_attempts, pg_temp.questions, pg_temp.topics, pg_temp.users",
    );
    await client.query("INSERT INTO pg_temp.users VALUES ($1), ($2)", [userA, userB]);
    await client.query(
      "INSERT INTO pg_temp.topics VALUES ($1, 'Routing', 'ACTIVE', 1), ($2, 'Access', 'ACTIVE', 2)",
      [a, b],
    );
    await client.query(
      "INSERT INTO pg_temp.questions VALUES ($1, $4, 'ACTIVE'), ($2, $4, 'ACTIVE'), ($3, $4, 'ACTIVE')",
      [q1, q2, q3, a],
    );
  });
  async function attempt(user: string, question: string, topic: string, correct: boolean) {
    await client.query(
      "INSERT INTO pg_temp.practice_attempts (user_id, question_id, topic_id, is_correct) VALUES ($1,$2,$3,$4)",
      [user, question, topic, correct],
    );
  }
  async function threeAttempts() {
    await attempt(userA, q1, a, true);
    await attempt(userA, q1, a, false);
    await attempt(userA, q2, a, true);
  }
  async function progress(user = userA) {
    const result = await getLearningProgress(user, db);
    expect(GetLearningProgressResponse.parse(result)).toEqual(result);
    for (const metric of [
      "totalAttempts",
      "correctAttempts",
      "availableQuestionCount",
      "coveredQuestionCount",
    ] as const) {
      expect(result.topics.reduce((sum, topic) => sum + topic[metric], 0)).toBe(
        result.summary[metric],
      );
    }
    expect(result.summary.coveragePercent).toBeLessThanOrEqual(100);
    return result;
  }
  it("computes 3 attempts, 2 correct, 2 unique and 66.67% without join multiplication", async () => {
    await threeAttempts();
    const result = await progress();
    expect(result.summary).toEqual({
      totalAttempts: 3,
      correctAttempts: 2,
      overallAccuracy: 66.67,
      uniqueQuestionsAttempted: 2,
      availableQuestionCount: 3,
      coveredQuestionCount: 2,
      coveragePercent: 66.67,
    });
    expect(result.topics.find((t) => t.topicId === a)?.accuracy).toBe(66.67);
  });
  it("counts many repeated wrong attempts once for coverage", async () => {
    for (let i = 0; i < 25; i++) await attempt(userA, q1, a, false);
    const result = await progress();
    expect(result.summary).toMatchObject({
      totalAttempts: 25,
      correctAttempts: 0,
      overallAccuracy: 0,
      uniqueQuestionsAttempted: 1,
      coveredQuestionCount: 1,
      coveragePercent: 33.33,
    });
  });
  it("returns zero history and includes active topics with no questions", async () => {
    const result = await progress();
    expect(result.summary).toMatchObject({
      totalAttempts: 0,
      overallAccuracy: 0,
      uniqueQuestionsAttempted: 0,
      coveredQuestionCount: 0,
      coveragePercent: 0,
    });
    expect(result.topics.find((t) => t.topicId === b)).toMatchObject({
      availableQuestionCount: 0,
      coveragePercent: 0,
      accuracy: 0,
    });
  });
  it("isolates users and computes attempt-weighted overall accuracy", async () => {
    await threeAttempts();
    await client.query("UPDATE pg_temp.questions SET topic_id = $1 WHERE id = $2", [b, q3]);
    await attempt(userA, q3, b, false);
    await attempt(userB, q1, a, true);
    expect((await progress()).summary).toMatchObject({
      totalAttempts: 4,
      correctAttempts: 2,
      overallAccuracy: 50,
    });
    expect((await progress(userB)).summary).toMatchObject({
      totalAttempts: 1,
      correctAttempts: 1,
      overallAccuracy: 100,
      uniqueQuestionsAttempted: 1,
      coveredQuestionCount: 1,
    });
  });
  it("preserves history when questions are disabled and restores coverage on reactivation", async () => {
    await threeAttempts();
    await client.query("UPDATE pg_temp.questions SET status = 'DISABLED' WHERE id IN ($1, $2)", [
      q1,
      q3,
    ]);
    expect((await progress()).summary).toMatchObject({
      totalAttempts: 3,
      correctAttempts: 2,
      uniqueQuestionsAttempted: 2,
      availableQuestionCount: 1,
      coveredQuestionCount: 1,
      coveragePercent: 100,
    });
    await client.query("UPDATE pg_temp.questions SET status = 'ACTIVE'");
    expect((await progress()).summary.coveragePercent).toBe(66.67);
  });
  it("includes disabled topics only for the current user's history and excludes their catalog", async () => {
    await threeAttempts();
    await client.query("UPDATE pg_temp.topics SET status = 'DISABLED'");
    const result = await progress();
    expect(result.topics.map((t) => t.topicId)).toEqual([a]);
    expect(result.summary).toMatchObject({
      totalAttempts: 3,
      availableQuestionCount: 0,
      coveredQuestionCount: 0,
      coveragePercent: 0,
    });
    expect((await progress(userB)).topics).toEqual([]);
    await client.query("UPDATE pg_temp.topics SET status = 'ACTIVE' WHERE id = $1", [a]);
    expect((await progress()).summary.coveragePercent).toBe(66.67);
  });
  it("moves coverage to the current topic while retaining historical attribution", async () => {
    await attempt(userA, q1, a, false);
    await client.query("UPDATE pg_temp.questions SET topic_id = $1 WHERE id = $2", [b, q1]);
    const result = await progress();
    expect(result.topics.find((t) => t.topicId === a)).toMatchObject({
      totalAttempts: 1,
      uniqueQuestionsAttempted: 1,
      coveredQuestionCount: 0,
    });
    expect(result.topics.find((t) => t.topicId === b)).toMatchObject({
      totalAttempts: 0,
      uniqueQuestionsAttempted: 0,
      coveredQuestionCount: 1,
      coveragePercent: 100,
    });
    await attempt(userA, q1, b, true);
    const after = await progress();
    expect(after.summary.uniqueQuestionsAttempted).toBe(1);
    expect(after.topics.reduce((sum, t) => sum + t.uniqueQuestionsAttempted, 0)).toBe(2);
    expect(after.summary.coveredQuestionCount).toBe(1);
  });
  it("hides current coverage after a move into a disabled topic but retains the original history", async () => {
    await attempt(userA, q1, a, true);
    await client.query("UPDATE pg_temp.topics SET status = 'DISABLED' WHERE id = $1", [b]);
    await client.query("UPDATE pg_temp.questions SET topic_id = $1 WHERE id = $2", [b, q1]);
    const result = await progress();
    expect(result.topics.map((t) => t.topicId)).toEqual([a]);
    expect(result.summary).toMatchObject({
      totalAttempts: 1,
      correctAttempts: 1,
      availableQuestionCount: 2,
      coveredQuestionCount: 0,
    });
  });
  it("returns the all-zero empty catalog response", async () => {
    await client.query("TRUNCATE pg_temp.practice_attempts, pg_temp.questions, pg_temp.topics");
    expect(await progress()).toEqual({
      summary: {
        totalAttempts: 0,
        correctAttempts: 0,
        overallAccuracy: 0,
        uniqueQuestionsAttempted: 0,
        availableQuestionCount: 0,
        coveredQuestionCount: 0,
        coveragePercent: 0,
      },
      topics: [],
    });
  });
  it("orders topics by display order, name and ID", async () => {
    await client.query("UPDATE pg_temp.topics SET display_order = 1, name = 'Same'");
    expect((await progress()).topics.map((t) => t.topicId)).toEqual([a, b]);
  });
  it("uses only SELECT aggregates and does not change existing rows", async () => {
    await threeAttempts();
    const before = await db
      .select()
      .from(practiceAttemptsTable)
      .where(eq(practiceAttemptsTable.userId, userA));
    await client.query("BEGIN READ ONLY");
    try {
      await progress();
    } finally {
      await client.query("ROLLBACK");
    }
    expect(
      await db.select().from(practiceAttemptsTable).where(eq(practiceAttemptsTable.userId, userA)),
    ).toEqual(before);
  });
});
