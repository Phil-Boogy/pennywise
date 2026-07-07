import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getBudgetSuggestion, getTransactionAnalysis, generateBudget } from "../controllers/ai";

const router = Router();

router.use(authenticateToken);
router.post("/suggest-budget", getBudgetSuggestion);
router.post("/analyze-transactions", getTransactionAnalysis);
router.post("/generate-budget", generateBudget);

export default router;