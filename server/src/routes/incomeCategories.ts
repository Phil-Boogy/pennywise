import { Router } from "express";

import {
    getIncomeCategories,
    createIncomeCategory,
    editSavedIncomeCategory,
    deleteSavedIncomeCategory
} from "../controllers/incomeCategories"

const router = Router();

router.get("/", getIncomeCategories);
router.post("/", createIncomeCategory);
router.put("/:id", editSavedIncomeCategory);
router.delete("/:id", deleteSavedIncomeCategory);

export default router;