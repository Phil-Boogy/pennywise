import { Router } from "express";
import {
    getExpenseCategories,
    createExpenseCategory,
    editSavedExpenseCategory,
    deleteSavedExpenseCategory,
} from "../controllers/expenseCategories";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken);

router.get("/", getExpenseCategories);
router.post("/", createExpenseCategory);
router.put("/:id", editSavedExpenseCategory);
router.delete("/:id", deleteSavedExpenseCategory);

export default router;