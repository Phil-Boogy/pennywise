import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
    getIncomes,
    createIncome,
    editSavedIncome,
    deleteSavedIncome
} from "../controllers/income"

const router = Router();

router.use(authenticateToken);
router.get("/", getIncomes);
router.post("/", createIncome);
router.put("/:id", editSavedIncome);
router.delete("/:id", deleteSavedIncome);

export default router;