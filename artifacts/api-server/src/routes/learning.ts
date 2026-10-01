import { asc, count, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  ListTopicsResponse,
} from "@workspace/api-zod";
import { db, topicsTable } from "@workspace/db";

const router: IRouter = Router();

function toTopicSummary(topic: typeof topicsTable.$inferSelect) {
  return {
    id: topic.id,
    slug: topic.slug,
    name: topic.name,
    description: topic.description,
    questionCount: 0,
    attemptedCount: 0,
    correctCount: 0,
    accuracy: 0,
    averageDurationSeconds: 0,
    progressPercent: 0,
    displayOrder: topic.displayOrder,
  };
}

router.get("/topics", async (req, res): Promise<void> => {
  req.log.info("Listing active CCNA topics");

  const topics = await db
    .select()
    .from(topicsTable)
    .where(eq(topicsTable.status, "ACTIVE"))
    .orderBy(asc(topicsTable.displayOrder), asc(topicsTable.name));

  res.json(ListTopicsResponse.parse(topics.map(toTopicSummary)));
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  req.log.info("Loading learning dashboard summary");

  const [topicCount] = await db
    .select({ value: count() })
    .from(topicsTable)
    .where(eq(topicsTable.status, "ACTIVE"));

  const topics = await db
    .select()
    .from(topicsTable)
    .where(eq(topicsTable.status, "ACTIVE"))
    .orderBy(asc(topicsTable.displayOrder), asc(topicsTable.name));

  const summaries = topics.map(toTopicSummary);
  const data = {
    totalTopics: topicCount?.value ?? 0,
    totalQuestions: 0,
    questionsAttempted: 0,
    overallAccuracy: 0,
    studyMinutes: 0,
    streakDays: 0,
    focusTopic: summaries[0] ?? null,
  };

  res.json(GetDashboardSummaryResponse.parse(data));
});

export default router;