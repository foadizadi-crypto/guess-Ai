import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiRouter from "./ai";
import configRouter from "./config";
import sessionsRouter from "./sessions";
import leaderboardRouter from "./leaderboard";
import nicknameRouter from "./nickname";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(configRouter);
router.use(sessionsRouter);
router.use(leaderboardRouter);
router.use(nicknameRouter);

export default router;
