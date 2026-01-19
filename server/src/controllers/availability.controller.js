import { Service } from "../models/Service.js";
import { Staff } from "../models/Staff.js";
import { Appointment } from "../models/Appointment.js";
import { TimeOff } from "../models/TimeOff.js";
import { getOrCreateSettings } from "./settings.controller.js";
import {
  addMinutesToHhmm,
  compareHhmm,
  dayOfWeekFromDate,
  overlaps,
} from "../lib/time.js";

export async function getAvailability(req, res, next) {
  try {
    const { serviceId, staffId, date } = req.query;

    if (!serviceId || !staffId || !date) {
      res.status(400);
      throw new Error("serviceId, staffId and date are required");
    }

    // Expect YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      res.status(400);
      throw new Error("date must be YYYY-MM-DD");
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404);
      throw new Error("Service not found");
    }

    const staff = await Staff.findById(staffId);
    if (!staff || !staff.active) {
      res.status(404);
      throw new Error("Staff not found");
    }

    const settings = await getOrCreateSettings();

    // NOTE: you currently use GLOBAL working hours from settings.
    // If you later switch to per-staff working hours, change this part only.
    const dow = dayOfWeekFromDate(date);
    const wh = settings.workingHours.find((x) => x.dayOfWeek === dow);

    if (!wh || wh.isClosed) {
      return res.json({ slots: [] });
    }

    // ✅ BLOCK WHOLE DAY if staff has time-off covering this date
    // Supports single day (startDate=endDate) and ranges.
    const timeOffForDate = await TimeOff.find({
      staffId,
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).select("startTime endTime startDate endDate reason");

    // If any timeOff record covers the date and has no times, treat as FULL DAY OFF
    const fullDayOff = timeOffForDate.some((t) => !t.startTime || !t.endTime);
    if (fullDayOff) {
      return res.json({ slots: [] });
    }

    const slotLen = settings.slotLengthMinutes;
    const duration = service.durationMinutes;

    const confirmed = await Appointment.find({
      staffId,
      date,
      status: "CONFIRMED",
    }).select("startTime endTime");

    const slots = [];

    let cur = wh.startTime;
    while (true) {
      const end = addMinutesToHhmm(cur, duration);
      if (compareHhmm(end, wh.endTime) > 0) break;

      const conflictsConfirmed = confirmed.some((a) =>
        overlaps(cur, end, a.startTime, a.endTime)
      );

      // Partial-day time off blocks
      const conflictsOff = timeOffForDate.some((t) =>
        overlaps(cur, end, t.startTime, t.endTime)
      );

      if (!conflictsConfirmed && !conflictsOff) {
        slots.push({ startTime: cur, endTime: end });
      }

      cur = addMinutesToHhmm(cur, slotLen);
      if (compareHhmm(cur, wh.endTime) >= 0) break;
    }

    res.json({ slots });
  } catch (e) {
    next(e);
  }
}
