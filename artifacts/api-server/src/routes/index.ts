import { Router, type IRouter } from "express";
import healthRouter from "./health";
import learningRouter from "./learning";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(learningRouter);
router.use(authRouter);

export default router;
