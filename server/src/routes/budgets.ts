import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getBudgets,
    createBudget,
    editSavedBudget,
    deleteSavedBudget,
    getBudgetsByMonth,
} from "../controllers/budgets";

const router = Router();
router.use(authenticateToken);
router.get("/", getBudgets);
router.get("/month/:month", getBudgetsByMonth);
router.post("/", createBudget);
router.put("/:id", editSavedBudget);
router.delete("/:id", deleteSavedBudget);

export default router;