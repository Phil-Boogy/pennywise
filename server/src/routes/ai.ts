import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getBudgetSuggestion } from "../controllers/ai";

const router = Router();

router.use(authenticateToken);
router.post("/suggest-budget", getBudgetSuggestion);

export default router;