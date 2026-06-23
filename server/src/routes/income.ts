import { Router } from "express";
import {
    getIncomes,
    createIncome,
    editSavedIncome,
    deleteSavedIncome
} from "../controllers/income"

const router = Router();

router.get("/", getIncomes);
router.post("/", createIncome);
router.put("/:id", editSavedIncome);
router.delete("/:id", deleteSavedIncome);

export default router;