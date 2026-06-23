import { Router } from "express";
import {
    getExpenses,
    createExpense,
    editSavedExpense,
    deleteSavedExpense
} from "../controllers/expenses";

const router = Router();

router.get("/", getExpenses);
router.post("/", createExpense);
router.put("/:id", editSavedExpense);
router.delete("/:id", deleteSavedExpense);

export default router;