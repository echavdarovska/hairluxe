import { Appointment } from "../models/Appointment.js";
import { Service } from "../models/Service.js";
import { Staff } from "../models/Staff.js";
import { User } from "../models/User.js";
import {
  createAppointmentSchema,
  declineSchema,
  proposeSchema,
  rejectProposalSchema,
  statusUpdateSchema,
} from "../validators/appointment.validators.js";
import { addMinutesToHhmm, overlaps } from "../lib/time.js";
import { notify } from "../services/notification.service.js";

const BLOCKING_STATUSES = ["CONFIRMED", "PENDING_ADMIN_REVIEW", "PROPOSED_TO_CLIENT"];

function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function compareYMD(a, b) {
  return String(a).localeCompare(String(b));
}
function timeToMinutes(t) {
  const [h, m] = String(t || "").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

async function ensureNoConflict(
  { staffId, date, startTime, endTime },
  ignoreAppointmentId = null
) {
  const q = {
    staffId,
    date,
    status: { $in: BLOCKING_STATUSES }, // block pending/proposed too so slots don't double-book
  };
  if (ignoreAppointmentId) q._id = { $ne: ignoreAppointmentId };

  const existing = await Appointment.find(q).select("startTime endTime");
  const conflict = existing.some((a) =>
    overlaps(startTime, endTime, a.startTime, a.endTime)
  );
  if (conflict) {
    const err = new Error("Time slot is no longer available");
    err.statusCode = 409;
    throw err;
  }
}

export async function createAppointment(req, res, next) {
  try {
    const data = createAppointmentSchema.parse(req.body);

    // Reject past date/time at the API boundary (UI checks are not enough).
    const today = todayLocalISO();
    if (!data.date || compareYMD(data.date, today) < 0) {
      const err = new Error("Cannot book past dates");
      err.statusCode = 422;
      throw err;
    }
    if (data.date === today) {
      const slotMin = timeToMinutes(data.startTime);
      if (slotMin == null) {
        const err = new Error("Invalid start time");
        err.statusCode = 422;
        throw err;
      }
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (slotMin < nowMin) {
        const err = new Error("Cannot book a past time slot");
        err.statusCode = 422;
        throw err;
      }
    }

    const service = await Service.findById(data.serviceId);
    if (!service) {
      const err = new Error("Service not found");
      err.statusCode = 404;
      throw err;
    }

    const staff = await Staff.findById(data.staffId);
    if (!staff || !staff.active) {
      const err = new Error("Staff not found");
      err.statusCode = 404;
      throw err;
    }

    const endTime = addMinutesToHhmm(data.startTime, service.durationMinutes);

    // Consistent conflict policy with availability: pending/proposed/confirmed block the slot.
    await ensureNoConflict({
      staffId: staff._id,
      date: data.date,
      startTime: data.startTime,
      endTime,
    });

    const appt = await Appointment.create({
      clientId: req.user._id,
      staffId: staff._id,
      serviceId: service._id,
      date: data.date,
      startTime: data.startTime,
      endTime,
      status: "PENDING_ADMIN_REVIEW",
      clientNote: data.clientNote,
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        notify(a._id, {
          type: "APPOINTMENT_REQUESTED",
          title: "New appointment request",
          message: `A client requested ${service.name} on ${appt.date} at ${appt.startTime}.`,
          appointmentId: appt._id,
        })
      )
    );

    res.status(201).json({ appointment: appt });
  } catch (e) {
    if (e.statusCode) res.status(e.statusCode);
    next(e);
  }
}

export async function myAppointments(req, res, next) {
  try {
    const items = await Appointment.find({ clientId: req.user._id })
      .populate("serviceId", "name durationMinutes price")
      .populate("staffId", "name")
      .sort({ createdAt: -1 });

    res.json({ appointments: items });
  } catch (e) {
    next(e);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const { status, staffId, dateFrom, dateTo } = req.query;

    const q = {};
    if (status) q.status = status;
    if (staffId) q.staffId = staffId;
    if (dateFrom || dateTo) {
      q.date = {};
      if (dateFrom) q.date.$gte = dateFrom;
      if (dateTo) q.date.$lte = dateTo;
    }

    const items = await Appointment.find(q)
      .populate("serviceId", "name durationMinutes price")
      .populate("staffId", "name")
      .populate("clientId", "name email")
      .sort({ date: 1, startTime: 1 });

    res.json({ appointments: items });
  } catch (e) {
    next(e);
  }
}

export async function confirmAppointment(req, res, next) {
  try {
    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    await ensureNoConflict(
      {
        staffId: appt.staffId,
        date: appt.date,
        startTime: appt.startTime,
        endTime: appt.endTime,
      },
      appt._id
    );

    appt.status = "CONFIRMED";
    appt.declineReason = "";
    appt.proposed = null;
    await appt.save();

    await notify(appt.clientId, {
      type: "APPOINTMENT_CONFIRMED",
      title: "Appointment confirmed",
      message: `Your appointment on ${appt.date} at ${appt.startTime} was confirmed.`,
      appointmentId: appt._id,
    });

    res.json({ appointment: appt });
  } catch (e) {
    if (e.statusCode) res.status(e.statusCode);
    next(e);
  }
}

export async function declineAppointment(req, res, next) {
  try {
    const data = declineSchema.parse(req.body);

    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    appt.status = "DECLINED";
    appt.declineReason = data.reason;
    appt.proposed = null;
    await appt.save();

    await notify(appt.clientId, {
      type: "APPOINTMENT_DECLINED",
      title: "Appointment declined",
      message: `Your request was declined: ${data.reason}`,
      appointmentId: appt._id,
    });

    res.json({ appointment: appt });
  } catch (e) {
    next(e);
  }
}

export async function proposeChanges(req, res, next) {
  try {
    const data = proposeSchema.parse(req.body);

    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "durationMinutes name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    const staff = await Staff.findById(data.staffId);
    if (!staff || !staff.active) {
      const err = new Error("Staff not found");
      err.statusCode = 404;
      throw err;
    }

    const endTime = addMinutesToHhmm(
      data.startTime,
      appt.serviceId.durationMinutes
    );

    await ensureNoConflict({
      staffId: staff._id,
      date: data.date,
      startTime: data.startTime,
      endTime,
    });

    appt.status = "PROPOSED_TO_CLIENT";
    appt.proposed = {
      staffId: staff._id,
      date: data.date,
      startTime: data.startTime,
      endTime,
      message: data.message,
    };
    await appt.save();

    await notify(appt.clientId, {
      type: "APPOINTMENT_PROPOSED",
      title: "Admin proposed a new time",
      message: `Proposed: ${data.date} at ${data.startTime}. ${
        data.message || ""
      }`.trim(),
      appointmentId: appt._id,
    });

    res.json({ appointment: appt });
  } catch (e) {
    if (e.statusCode) res.status(e.statusCode);
    next(e);
  }
}

export async function acceptProposal(req, res, next) {
  try {
    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(appt.clientId) !== String(req.user._id)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }

    if (appt.status !== "PROPOSED_TO_CLIENT" || !appt.proposed) {
      const err = new Error("No proposal to accept");
      err.statusCode = 400;
      throw err;
    }

    await ensureNoConflict(
      {
        staffId: appt.proposed.staffId,
        date: appt.proposed.date,
        startTime: appt.proposed.startTime,
        endTime: appt.proposed.endTime,
      },
      appt._id
    );

    appt.staffId = appt.proposed.staffId;
    appt.date = appt.proposed.date;
    appt.startTime = appt.proposed.startTime;
    appt.endTime = appt.proposed.endTime;
    appt.status = "CONFIRMED";
    appt.proposed = null;
    await appt.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        notify(a._id, {
          type: "PROPOSAL_ACCEPTED",
          title: "Client accepted proposal",
          message: `Client accepted the proposed time for appointment on ${appt.date} at ${appt.startTime}.`,
          appointmentId: appt._id,
        })
      )
    );

    res.json({ appointment: appt });
  } catch (e) {
    if (e.statusCode) res.status(e.statusCode);
    next(e);
  }
}

export async function rejectProposal(req, res, next) {
  try {
    const data = rejectProposalSchema.parse(req.body);

    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(appt.clientId) !== String(req.user._id)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }

    if (appt.status !== "PROPOSED_TO_CLIENT") {
      const err = new Error("No proposal to reject");
      err.statusCode = 400;
      throw err;
    }

    appt.status = "CLIENT_REJECTED_PROPOSAL";
    await appt.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        notify(a._id, {
          type: "PROPOSAL_REJECTED",
          title: "Client rejected proposal",
          message: `Client rejected the proposed changes.${
            data.message ? " Message: " + data.message : ""
          }`,
          appointmentId: appt._id,
        })
      )
    );

    res.json({ appointment: appt });
  } catch (e) {
    next(e);
  }
}

export async function cancelAppointment(req, res, next) {
  try {
    const appt = await Appointment.findById(req.params.id).populate(
      "serviceId",
      "name"
    );
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }
    if (String(appt.clientId) !== String(req.user._id)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      throw err;
    }
    if (["COMPLETED", "NO_SHOW"].includes(appt.status)) {
      const err = new Error("Cannot cancel a finished appointment");
      err.statusCode = 400;
      throw err;
    }

    appt.status = "CANCELLED";
    appt.proposed = null;
    await appt.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((a) =>
        notify(a._id, {
          type: "APPOINTMENT_CANCELLED",
          title: "Appointment cancelled",
          message: `Client cancelled appointment on ${appt.date} at ${appt.startTime}.`,
          appointmentId: appt._id,
        })
      )
    );

    res.json({ appointment: appt });
  } catch (e) {
    next(e);
  }
}

export async function adminSetStatus(req, res, next) {
  try {
    const data = statusUpdateSchema.parse(req.body);

    const appt = await Appointment.findById(req.params.id);
    if (!appt) {
      const err = new Error("Appointment not found");
      err.statusCode = 404;
      throw err;
    }

    appt.status = data.status;
    await appt.save();

    await notify(appt.clientId, {
      type: "APPOINTMENT_STATUS",
      title: "Appointment updated",
      message: `Your appointment status is now: ${data.status}`,
      appointmentId: appt._id,
    });

    res.json({ appointment: appt });
  } catch (e) {
    next(e);
  }
}
