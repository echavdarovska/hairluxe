import { Router } from "express";
import { listServices, createService, updateService, deleteService } from "../controllers/service.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", listServices);
router.post("/", requireAuth, requireRole("admin"), createService);
router.put("/:id", requireAuth, requireRole("admin"), updateService);
router.delete("/:id", requireAuth, requireRole("admin"), deleteService);

export default router;
