import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listNotifications, markRead, markAllRead } from "../controllers/notification.controller.js";

const router = Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:id/read", requireAuth, markRead);
router.patch("/read-all", requireAuth, markAllRead);

export default router;
