import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getExpenses,
    createExpense,
    editSavedExpense,
    deleteSavedExpense,
    getExpensesByMonth,
} from "../controllers/expenses";

const router = Router();

router.use(authenticateToken);
router.get("/", getExpenses);
router.get("/month/:month", getExpensesByMonth);
router.post("/", createExpense);
router.put("/:id", editSavedExpense);
router.delete("/:id", deleteSavedExpense);

export default router;