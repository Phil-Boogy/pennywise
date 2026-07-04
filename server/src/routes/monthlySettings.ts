import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { getSettings, saveSettings } from "../controllers/monthlySettings";

const router = Router();

router.use(authenticateToken);
router.get("/:month", getSettings);
router.post("/:month", saveSettings);

export default router;