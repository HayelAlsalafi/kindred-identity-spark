import { Router, type IRouter } from "express";
import { GetQuestionResponse } from "@workspace/api-zod";
import { requireAuthenticatedUser } from "../middlewares/auth";
import { getLearnerQuestion } from "../lib/questions";

const router: IRouter = Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get("/questions/:id", requireAuthenticatedUser, async (req, res): Promise<void> => {
  const id = String(req.params["id"] ?? "");
  const notFound = () =>
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Question not found." } });
  if (!UUID.test(id)) {
    notFound();
    return;
  }
  const question = await getLearnerQuestion(id);
  if (!question) {
    notFound();
    return;
  }
  res.json(GetQuestionResponse.parse(question));
});

export default router;
