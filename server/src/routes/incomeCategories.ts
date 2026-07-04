import { Router } from "express";

import { authenticateToken } from "../middleware/auth";
import {
    getIncomeCategories,
    createIncomeCategory,
    editSavedIncomeCategory,
    deleteSavedIncomeCategory
} from "../controllers/incomeCategories"

const router = Router();

router.use(authenticateToken);
router.get("/", getIncomeCategories);
router.post("/", createIncomeCategory);
router.put("/:id", editSavedIncomeCategory);
router.delete("/:id", deleteSavedIncomeCategory);

export default router;