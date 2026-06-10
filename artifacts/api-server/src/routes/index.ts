import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import accountsRouter from "./accounts";
import categoriesRouter from "./categories";
import transactionsRouter from "./transactions";
import summaryRouter from "./summary";
import adminRouter from "./admin";
import subscriptionsRouter from "./subscriptions";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);

// Require authentication for all endpoints below this line
router.use(requireAuth);

router.use(accountsRouter);
router.use(categoriesRouter);
router.use(transactionsRouter);
router.use(summaryRouter);
router.use(adminRouter);
router.use(subscriptionsRouter);

export default router;
