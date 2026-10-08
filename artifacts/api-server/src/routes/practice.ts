import { Router, type IRouter, type Response } from "express";
import {
  GetPracticeQuestionResponse,
  SubmitPracticeAnswerBody,
  SubmitPracticeAnswerResponse,
} from "@workspace/api-zod";
import { requireAuthenticatedUser } from "../middlewares/auth";
import {
  getPracticeQuestionForTopic,
  PracticeApiError,
  submitPracticeAnswer,
} from "../lib/practice";

const router: IRouter = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Practice question not found." } });
}

router.get(
  "/practice/topics/:topicId/question",
  requireAuthenticatedUser,
  async (req, res): Promise<void> => {
    const topicId = String(req.params["topicId"] ?? "");
    if (!UUID.test(topicId)) {
      notFound(res);
      return;
    }

    try {
      const question = await getPracticeQuestionForTopic(topicId);
      if (!question) {
        notFound(res);
        return;
      }

      // Keep the wire response allow-listed even if a service later returns
      // additional internal question or option fields.
      res.json(
        GetPracticeQuestionResponse.parse({
          id: question.id,
          questionCode: question.questionCode,
          topic: {
            id: question.topic.id,
            slug: question.topic.slug,
            name: question.topic.name,
          },
          text: question.text,
          type: question.type,
          difficulty: question.difficulty,
          options: question.options.map(({ optionKey, text }) => ({ optionKey, text })),
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Could not fetch practice question");
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Practice question could not be fetched." },
      });
    }
  },
);

router.post(
  "/practice/questions/:questionId/answer",
  requireAuthenticatedUser,
  async (req, res): Promise<void> => {
    // Fail closed if the authentication middleware did not attach a local user.
    if (!req.dbUser) {
      res.status(401).json({
        error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      });
      return;
    }
    const questionId = String(req.params["questionId"] ?? "");
    if (!UUID.test(questionId)) {
      notFound(res);
      return;
    }

    const parsedBody = SubmitPracticeAnswerBody.strict().safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "A valid optionKey is required." },
      });
      return;
    }

    try {
      const result = await submitPracticeAnswer(questionId, parsedBody.data.optionKey, req.dbUser.id);
      if (!result) {
        notFound(res);
        return;
      }
      res.json(SubmitPracticeAnswerResponse.parse(result));
    } catch (error) {
      if (error instanceof PracticeApiError) {
        res.status(error.status).json({
          error: { code: error.code, message: error.message },
        });
        return;
      }
      req.log.error({ err: error }, "Could not submit practice answer");
      res.status(500).json({
        error: { code: "INTERNAL_ERROR", message: "Practice answer could not be submitted." },
      });
    }
  },
);

export default router;
