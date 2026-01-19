import express from "express";
import { getScheduleBoard } from "../controllers/adminScheduleController.js";

const router = express.Router();

// router.get("/schedule-board", requireAdmin, getScheduleBoard);
router.get("/schedule-board", getScheduleBoard);

export default router;
