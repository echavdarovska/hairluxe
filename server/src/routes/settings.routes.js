import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getWorkingHours, updateWorkingHours, getSlotLength, updateSlotLength } from "../controllers/settings.controller.js";

const router = Router();

router.get("/working-hours", getWorkingHours);
router.put("/working-hours", requireAuth, requireRole("admin"), updateWorkingHours);

router.get("/slot-length", getSlotLength);
router.put("/slot-length", requireAuth, requireRole("admin"), updateSlotLength);

export default router;
