import express from "express";

import {
  getStaffWorkingHours,
  putStaffWorkingHours,
} from "../controllers/adminStaffHoursController.js";

import {
  listTimeOff,
  createTimeOff,
  deleteTimeOff,
} from "../controllers/timeoff.controller.js";

const router = express.Router();


router.get("/staff/:staffId/working-hours", getStaffWorkingHours);
router.put("/staff/:staffId/working-hours", putStaffWorkingHours);

router.get("/staff/:staffId/time-off", listTimeOff);
router.post("/staff/:staffId/time-off", createTimeOff);
router.delete("/staff/:staffId/time-off/:timeOffId", deleteTimeOff);

export default router;
