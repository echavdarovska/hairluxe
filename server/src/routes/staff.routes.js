import { Router } from "express";
import { listStaff, createStaff, updateStaff, deleteStaff } from "../controllers/staff.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listStaff);
router.post("/", requireAuth, requireRole("admin"), createStaff);
router.put("/:id", requireAuth, requireRole("admin"), updateStaff);
router.delete("/:id", requireAuth, requireRole("admin"), deleteStaff);

export default router;
