import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getCashExpenses,
    createNewCashExpense,
    updateSavedCashExpense,
    deleteSavedCashExpense,
} from "../controllers/cashExpenses";

const router = Router();

router.use(authenticateToken);
router.get("/", getCashExpenses);
router.post("/", createNewCashExpense);
router.put("/:id", updateSavedCashExpense);
router.delete("/:id", deleteSavedCashExpense);

export default router;