import { Router } from "express";
import {
    getBudgets,
    createBudget,
    editSavedBudget,
    deleteSavedBudget
} from "../controllers/budgets"

const router = Router();

router.get("/", getBudgets);
router.post("/", createBudget);
router.put("/:id", editSavedBudget);
router.delete("/:id", deleteSavedBudget);

export default router;