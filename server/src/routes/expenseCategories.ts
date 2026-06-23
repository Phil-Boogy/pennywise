import { Router } from "express";
import {
    getExpenseCategories,
    createExpenseCategory,
    editSavedExpenseCategory,
    deleteSavedExpenseCategory,
} from "../controllers/expenseCategories";

const router = Router();

router.get("/", getExpenseCategories);
router.post("/", createExpenseCategory);
router.put("/:id", editSavedExpenseCategory);
router.delete("/:id", deleteSavedExpenseCategory);

export default router;