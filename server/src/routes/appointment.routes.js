import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createAppointment,
  myAppointments,
  listAppointments,
  confirmAppointment,
  declineAppointment,
  proposeChanges,
  acceptProposal,
  rejectProposal,
  cancelAppointment,
  adminSetStatus
} from "../controllers/appointment.controller.js";

const router = Router();

router.post("/", requireAuth, createAppointment);
router.get("/my", requireAuth, myAppointments);

router.get("/", requireAuth, requireRole("admin"), listAppointments);
router.patch("/:id/confirm", requireAuth, requireRole("admin"), confirmAppointment);
router.patch("/:id/decline", requireAuth, requireRole("admin"), declineAppointment);
router.patch("/:id/propose", requireAuth, requireRole("admin"), proposeChanges);
router.patch("/:id/status", requireAuth, requireRole("admin"), adminSetStatus);

router.patch("/:id/accept-proposal", requireAuth, acceptProposal);
router.patch("/:id/reject-proposal", requireAuth, rejectProposal);
router.patch("/:id/cancel", requireAuth, cancelAppointment);

export default router;
