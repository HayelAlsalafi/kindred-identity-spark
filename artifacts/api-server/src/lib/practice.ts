import { and, asc, desc, eq, lt, or, sql } from "drizzle-orm";
import {
  db as defaultDb,
  practiceAttemptsTable,
  questionOptionsTable,
  questionsTable,
  topicsTable,
} from "@workspace/db";

type Db = typeof defaultDb;

export class PracticeApiError extends Error {
  constructor(
    public readonly status: 400 | 500,
    public readonly code: "INVALID_OPTION" | "INTERNAL_ERROR",
    message: string,
  ) {
    super(message);
  }
}

function activePracticeQuestionFilter(questionId: string) {
  return and(
    eq(questionsTable.id, questionId),
    eq(questionsTable.status, "ACTIVE"),
    eq(topicsTable.status, "ACTIVE"),
  );
}

/**
 * Selects one random active question in an active topic. The returned DTO is
 * deliberately allow-listed and never contains answer or explanation fields.
 */
export async function getPracticeQuestionForTopic(topicId: string, db: Db = defaultDb) {
  const [row] = await db
    .select({
      question: questionsTable,
      topic: {
        id: topicsTable.id,
        slug: topicsTable.slug,
        name: topicsTable.name,
      },
    })
    .from(questionsTable)
    .innerJoin(topicsTable, eq(topicsTable.id, questionsTable.topicId))
    .where(
      and(
        eq(topicsTable.id, topicId),
        eq(topicsTable.status, "ACTIVE"),
        eq(questionsTable.status, "ACTIVE"),
      ),
    )
    .orderBy(sql`random()`)
    .limit(1);

  if (!row) return null;

  const options = await db
    .select({
      optionKey: questionOptionsTable.optionKey,
      text: questionOptionsTable.text,
    })
    .from(questionOptionsTable)
    .where(eq(questionOptionsTable.questionId, row.question.id))
    .orderBy(asc(questionOptionsTable.displayOrder));

  return {
    id: row.question.id,
    questionCode: row.question.questionCode,
    topic: row.topic,
    text: row.question.text,
    type: row.question.type,
    difficulty: row.question.difficulty,
    options,
  };
}

/**
 * Grades and persists one submission atomically. The caller supplies the
 * internal user ID from authenticated server context, never from client input.
 * Disabled questions/topics remain indistinguishable from missing questions.
 */
export async function submitPracticeAnswer(
  questionId: string,
  selectedOptionKey: string,
  userId: string,
  db: Db = defaultDb,
) {
  return db.transaction(async (tx) => {
    // SHARE locks allow concurrent submissions, but prevent question/topic
    // edits or disables until this attempt commits. Admin option replacement
    // updates the parent question first and therefore waits on this lock too.
    const [row] = await tx
      .select({ question: questionsTable })
      .from(questionsTable)
      .innerJoin(topicsTable, eq(topicsTable.id, questionsTable.topicId))
      .where(activePracticeQuestionFilter(questionId))
      .limit(1)
      .for("share");

    if (!row) return null;

    const options = await tx
      .select({
        optionKey: questionOptionsTable.optionKey,
        text: questionOptionsTable.text,
        isCorrect: questionOptionsTable.isCorrect,
      })
      .from(questionOptionsTable)
      .where(eq(questionOptionsTable.questionId, questionId))
      .orderBy(asc(questionOptionsTable.displayOrder))
      .for("share");

    const normalizedKey = selectedOptionKey.trim().toUpperCase();
    const selectedOption = options.find((option) => option.optionKey === normalizedKey);
    if (!selectedOption) {
      throw new PracticeApiError(400, "INVALID_OPTION", "Selected option is not part of this question.");
    }

    const correctOptions = options.filter((option) => option.isCorrect);
    const correctOption = correctOptions[0];
    if (correctOptions.length !== 1 || !correctOption) {
      throw new PracticeApiError(500, "INTERNAL_ERROR", "Question answer data is unavailable.");
    }

    await tx.insert(practiceAttemptsTable).values({
      userId,
      questionId: row.question.id,
      topicId: row.question.topicId,
      selectedOptionKey: normalizedKey,
      isCorrect: selectedOption.isCorrect,
    });

    return {
      isCorrect: selectedOption.isCorrect,
      correctOption: {
        optionKey: correctOption.optionKey,
        text: correctOption.text,
      },
      explanation: row.question.explanation,
    };
  });
}


const HISTORY_LIMIT_DEFAULT = 20;
const HISTORY_LIMIT_MAX = 100;
const HISTORY_CURSOR_PATTERN = /^[A-Za-z0-9_-]+$/;

type HistoryCursor = {
  submittedAt: string;
  id: string;
};

function decodeHistoryCursor(cursor: string): HistoryCursor {
  if (
    cursor.length === 0 ||
    cursor.length > 512 ||
    !HISTORY_CURSOR_PATTERN.test(cursor)
  ) {
    throw new Error("Invalid practice history cursor");
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid cursor");
    }

    const value = parsed as Record<string, unknown>;
    const timestamp = value.submittedAt;
    const id = value.id;

    if (
      typeof timestamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.(?:\d{3}|\d{6})Z$/.test(timestamp) ||
      !Number.isFinite(Date.parse(timestamp)) ||
      new Date(timestamp).toISOString() !== timestamp.replace(/\.(\d{3})\d{3}Z$/, ".$1Z") ||
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      throw new Error("Invalid cursor fields");
    }

    return { submittedAt: timestamp, id };
  } catch {
    throw new Error("Invalid practice history cursor");
  }
}

/**
 * Returns only the authenticated user's attempts in stable descending order.
 * The cursor encodes the last row's timestamp and UUID, never a user ID.
 */
export async function getPracticeHistory(
  userId: string,
  limit: number = HISTORY_LIMIT_DEFAULT,
  cursor?: string,
  db: Pick<Db, "select"> = defaultDb,
  includeDetails: boolean = false,
) {
  if (!Number.isInteger(limit) || limit < 1 || limit > HISTORY_LIMIT_MAX) {
    throw new Error("Invalid practice history limit");
  }

  const decoded = cursor === undefined ? undefined : decodeHistoryCursor(cursor);

  const cursorFilter = decoded
    ? or(
        lt(practiceAttemptsTable.submittedAt, sql`${decoded.submittedAt}::timestamptz`),
        and(
          eq(practiceAttemptsTable.submittedAt, sql`${decoded.submittedAt}::timestamptz`),
          lt(practiceAttemptsTable.id, decoded.id),
        ),
      )
    : undefined;

  let historyQuery = db
    .select({
      id: practiceAttemptsTable.id,
      questionId: practiceAttemptsTable.questionId,
      topicId: practiceAttemptsTable.topicId,
      selectedOptionKey: practiceAttemptsTable.selectedOptionKey,
      isCorrect: practiceAttemptsTable.isCorrect,
      submittedAt: practiceAttemptsTable.submittedAt,
      // Preserve PostgreSQL microseconds for the opaque cursor, not the DTO.
      submittedAtExact: sql<string>`to_char(${practiceAttemptsTable.submittedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
      ...(includeDetails ? {
        questionCode: sql<string | null>`${questionsTable.questionCode}`,
        topicName: sql<string | null>`${topicsTable.name}`,
      } : {}),
    })
    .from(practiceAttemptsTable)
    .$dynamic();

  if (includeDetails) {
    // Preserve missing/disabled references and the submission-time topic.
    historyQuery = historyQuery
      .leftJoin(questionsTable, eq(questionsTable.id, practiceAttemptsTable.questionId))
      .leftJoin(topicsTable, eq(topicsTable.id, practiceAttemptsTable.topicId));
  }

  const rows = await historyQuery
    .where(and(eq(practiceAttemptsTable.userId, userId), cursorFilter))
    .orderBy(
      desc(practiceAttemptsTable.submittedAt),
      desc(practiceAttemptsTable.id),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const last = page.at(-1);

  const nextCursor =
    hasMore && last
      ? Buffer.from(
          JSON.stringify({
            submittedAt: last.submittedAtExact,
            id: last.id,
          }),
        ).toString("base64url")
      : null;

  return {
    items: page.map(({ submittedAtExact: _exact, ...row }) => ({
      ...row,
      submittedAt: row.submittedAt.toISOString(),
    })),
    nextCursor,
  };
}
