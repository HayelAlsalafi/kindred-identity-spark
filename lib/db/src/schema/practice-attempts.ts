import { boolean, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { questionsTable } from "./questions";
import { topicsTable } from "./topics";
import { usersTable } from "./users";

/**
 * Append-only submission records. Topic and grading values reflect submission
 * time; disabling or editing a question must not rewrite its attempt history.
 * No unique user/question constraint: every valid submission is a new attempt.
 */
export const practiceAttemptsTable = pgTable(
  "practice_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questionsTable.id, { onDelete: "restrict" }),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topicsTable.id, { onDelete: "restrict" }),
    selectedOptionKey: varchar("selected_option_key", { length: 8 }).notNull(),
    isCorrect: boolean("is_correct").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("practice_attempts_user_history_idx").on(table.userId, table.submittedAt, table.id),
    index("practice_attempts_user_topic_idx").on(table.userId, table.topicId, table.submittedAt, table.id),
    index("practice_attempts_chronological_idx").on(table.submittedAt, table.id),
    index("practice_attempts_question_idx").on(table.questionId),
  ],
);

export type PracticeAttempt = typeof practiceAttemptsTable.$inferSelect;
export type InsertPracticeAttempt = typeof practiceAttemptsTable.$inferInsert;
