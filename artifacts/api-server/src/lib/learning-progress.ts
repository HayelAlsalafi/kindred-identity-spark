import { sql } from "drizzle-orm";
import { GetLearningProgressResponse } from "@workspace/api-zod";
import { db as defaultDb, practiceAttemptsTable, questionsTable, topicsTable } from "@workspace/db";

/**
 * One PostgreSQL statement gives history and the current catalog the same
 * snapshot. Each cohort is aggregated before joining: repeated attempts never
 * multiply current question counts. The caller supplies req.dbUser.id only.
 */
export async function getLearningProgress(
  userId: string,
  db: Pick<typeof defaultDb, "execute"> = defaultDb,
) {
  const result = await db.execute(sql`
    WITH user_attempts AS (
      SELECT
        ${practiceAttemptsTable.questionId} AS question_id,
        ${practiceAttemptsTable.topicId} AS topic_id,
        ${practiceAttemptsTable.isCorrect} AS is_correct
      FROM ${practiceAttemptsTable}
      WHERE ${practiceAttemptsTable.userId} = ${userId}::uuid
    ),
    historical_totals AS (
      SELECT
        count(*) AS total_attempts,
        count(*) FILTER (WHERE is_correct) AS correct_attempts,
        count(DISTINCT question_id) AS unique_questions
      FROM user_attempts
    ),
    historical_topics AS (
      SELECT topic_id,
        count(*) AS total_attempts,
        count(*) FILTER (WHERE is_correct) AS correct_attempts,
        count(DISTINCT question_id) AS unique_questions
      FROM user_attempts
      GROUP BY topic_id
    ),
    attempted_questions AS (
      SELECT DISTINCT question_id FROM user_attempts
    ),
    current_questions AS (
      SELECT ${questionsTable.id} AS question_id,
        ${questionsTable.topicId} AS topic_id
      FROM ${questionsTable}
      INNER JOIN ${topicsTable}
        ON ${topicsTable.id} = ${questionsTable.topicId}
      WHERE ${questionsTable.status} = 'ACTIVE'
        AND ${topicsTable.status} = 'ACTIVE'
    ),
    current_topics AS (
      SELECT topic_id,
        count(*) AS available_questions,
        count(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM attempted_questions a
            WHERE a.question_id = current_questions.question_id
          )
        ) AS covered_questions
      FROM current_questions
      GROUP BY topic_id
    ),
    current_totals AS (
      SELECT coalesce(sum(available_questions), 0) AS available_questions,
        coalesce(sum(covered_questions), 0) AS covered_questions
      FROM current_topics
    ),
    topic_metrics AS (
      SELECT ${topicsTable.id} AS topic_id,
        ${topicsTable.name} AS topic_name,
        ${topicsTable.status} AS status,
        ${topicsTable.displayOrder} AS display_order,
        coalesce(h.total_attempts, 0) AS total_attempts,
        coalesce(h.correct_attempts, 0) AS correct_attempts,
        coalesce(h.unique_questions, 0) AS unique_questions,
        coalesce(c.available_questions, 0) AS available_questions,
        coalesce(c.covered_questions, 0) AS covered_questions
      FROM ${topicsTable}
      LEFT JOIN historical_topics h ON h.topic_id = ${topicsTable.id}
      LEFT JOIN current_topics c ON c.topic_id = ${topicsTable.id}
      WHERE ${topicsTable.status} = 'ACTIVE' OR h.total_attempts > 0
    )
    SELECT json_build_object(
      'totalAttempts', h.total_attempts,
      'correctAttempts', h.correct_attempts,
      'overallAccuracy', coalesce(round(
        100.0 * h.correct_attempts / nullif(h.total_attempts, 0), 2
      ), 0),
      'uniqueQuestionsAttempted', h.unique_questions,
      'availableQuestionCount', c.available_questions,
      'coveredQuestionCount', c.covered_questions,
      'coveragePercent', coalesce(round(
        100.0 * c.covered_questions / nullif(c.available_questions, 0), 2
      ), 0)
    ) AS summary,
    coalesce((
      SELECT json_agg(json_build_object(
        'topicId', topic_id,
        'topicName', topic_name,
        'status', status,
        'displayOrder', display_order,
        'totalAttempts', total_attempts,
        'correctAttempts', correct_attempts,
        'accuracy', coalesce(round(
          100.0 * correct_attempts / nullif(total_attempts, 0), 2
        ), 0),
        'uniqueQuestionsAttempted', unique_questions,
        'availableQuestionCount', available_questions,
        'coveredQuestionCount', covered_questions,
        'coveragePercent', coalesce(round(
          100.0 * covered_questions / nullif(available_questions, 0), 2
        ), 0)
      ) ORDER BY display_order, topic_name, topic_id)
      FROM topic_metrics
    ), '[]'::json) AS topics
    FROM historical_totals h CROSS JOIN current_totals c
  `);

  // Generated from the approved OpenAPI contract; no hand-maintained DTO.
  return GetLearningProgressResponse.parse(result.rows[0]);
}
