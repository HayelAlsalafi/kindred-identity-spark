import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./learning";
import authRouter from "./auth";
import questionsRouter from "./questions";
import practiceRouter from "./practice";
import adminTopicsRouter from "./admin-topics";
import adminQuestionsRouter from "./admin-questions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(authRouter);
router.use(questionsRouter);
router.use(practiceRouter);
router.use(adminTopicsRouter);
router.use(adminQuestionsRouter);

export default router;
