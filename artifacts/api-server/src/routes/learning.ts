import { asc, count, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  GetLearningProgressResponse,
  ListTopicsResponse,
} from "@workspace/api-zod";
import { db, topicsTable } from "@workspace/db";

import { requireAuthenticatedUser } from "../middlewares/auth";
import { getLearningProgress } from "../lib/learning-progress";

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

router.get(
  "/learning/progress",
  (_req, res, next) => {
    // Set before authentication so errors also cannot cache personal metrics.
    res.set("Cache-Control", "private, no-store");
    next();
  },
  requireAuthenticatedUser,
  async (req, res): Promise<void> => {
    if (!req.dbUser) {
      res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      });
      return;
    }

    if (
      new URL(req.originalUrl, "http://localhost").searchParams.size > 0 ||
      req.body !== undefined ||
      Number(req.headers["content-length"] ?? 0) > 0 ||
      req.headers["transfer-encoding"] !== undefined
    ) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameters and request bodies are not supported.",
        },
      });
      return;
    }

    try {
      const result = await getLearningProgress(req.dbUser.id);
      res.json(GetLearningProgressResponse.parse(result));
    } catch {
      // Do not log database query text, bound values or connection details.
      req.log.error("Could not load learning progress");
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "Learning progress could not be loaded.",
        },
      });
    }
  },
);

export default router;