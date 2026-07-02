import { Router } from "express";
import { getSettings, saveSettings } from "../controllers/monthlySettings";

const router = Router();

router.get("/:month", getSettings);
router.post("/:month", saveSettings);

export default router;