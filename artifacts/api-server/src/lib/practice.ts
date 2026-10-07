import { and, asc, eq, sql } from "drizzle-orm";
import {
  db as defaultDb,
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
 * Grades an answer against the current database record. No attempt is written
 * in this phase; disabled questions and topics are indistinguishable from
 * missing questions.
 */
export async function submitPracticeAnswer(
  questionId: string,
  selectedOptionKey: string,
  db: Db = defaultDb,
) {
  const [row] = await db
    .select({ question: questionsTable })
    .from(questionsTable)
    .innerJoin(topicsTable, eq(topicsTable.id, questionsTable.topicId))
    .where(activePracticeQuestionFilter(questionId))
    .limit(1);

  if (!row) return null;

  const options = await db
    .select({
      optionKey: questionOptionsTable.optionKey,
      text: questionOptionsTable.text,
      isCorrect: questionOptionsTable.isCorrect,
    })
    .from(questionOptionsTable)
    .where(eq(questionOptionsTable.questionId, questionId))
    .orderBy(asc(questionOptionsTable.displayOrder));

  const normalizedKey = selectedOptionKey.trim().toUpperCase();
  const selectedOption = options.find((option) => option.optionKey === normalizedKey);
  if (!selectedOption) {
    throw new PracticeApiError(400, "INVALID_OPTION", "Selected option is not part of this question.");
  }

  const correctOption = options.find((option) => option.isCorrect);
  if (!correctOption) {
    throw new PracticeApiError(500, "INTERNAL_ERROR", "Question answer data is unavailable.");
  }

  return {
    isCorrect: selectedOption.isCorrect,
    correctOption: {
      optionKey: correctOption.optionKey,
      text: correctOption.text,
    },
    explanation: row.question.explanation,
  };
}
