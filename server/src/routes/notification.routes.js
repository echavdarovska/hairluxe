import express from "express";
import {
  listNotifications,
  markRead,
  markAllRead,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listNotifications);
router.patch("/:id/read", requireAuth, markRead);
router.patch("/read-all", requireAuth, markAllRead);

export default router;
