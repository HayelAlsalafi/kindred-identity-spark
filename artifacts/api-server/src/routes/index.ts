import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./learning";
import authRouter from "./auth";
import questionsRouter from "./questions";
import adminTopicsRouter from "./admin-topics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(authRouter);
router.use(questionsRouter);
router.use(adminTopicsRouter);

export default router;
