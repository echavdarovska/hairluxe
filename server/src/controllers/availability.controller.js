import { Service } from "../models/Service.js";
import { Staff } from "../models/Staff.js";
import { Appointment } from "../models/Appointment.js";
import { StaffWorkingHours } from "../models/StaffWorkingHours.js";
import { TimeOff } from "../models/TimeOff.js";
import { addMinutesToHhmm, compareHhmm, overlaps } from "../lib/time.js";

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
function toDayOfWeekMon0(dateStr) {
  const js = new Date(dateStr + "T00:00:00").getDay(); // 0=Sun..6=Sat
  return (js + 6) % 7; // 0=Mon..6=Sun
}

export async function getAvailability(req, res, next) {
  try {
    const { serviceId, staffId, date } = req.query;

    if (!serviceId || !staffId || !date) {
      return res.status(400).json({ message: "serviceId, staffId and date are required" });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({ message: "date must be YYYY-MM-DD" });
    }

    const today = todayLocalISO();
    if (compareYMD(date, today) < 0) {
      return res.json({ slots: [] });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const staff = await Staff.findById(staffId);
    if (!staff || !staff.active) return res.status(404).json({ message: "Staff not found" });

 
    const dow = toDayOfWeekMon0(date);
    const wh = await StaffWorkingHours.findOne({ staffId, dayOfWeek: dow }).lean();
    if (!wh) return res.json({ slots: [] });


    const timeOffForDate = await TimeOff.find({
      staffId,
      startDate: { $lte: date },
      endDate: { $gte: date },
    })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    const fullDayOff = timeOffForDate.some((t) => !t.startTime || !t.endTime);
    if (fullDayOff) return res.json({ slots: [] });

    const slotLen = 30; 
    const duration = service.durationMinutes;

    const blockingAppts = await Appointment.find({
      staffId,
      date,
      status: { $in: BLOCKING_STATUSES },
    }).select("startTime endTime");

    const nowMin =
      date === today ? new Date().getHours() * 60 + new Date().getMinutes() : null;

    const slots = [];
    let cur = wh.startTime;

    while (true) {
      const end = addMinutesToHhmm(cur, duration);
      if (compareHhmm(end, wh.endTime) > 0) break;

      if (nowMin != null) {
        const curMin = timeToMinutes(cur);
        if (curMin != null && curMin < nowMin) {
          cur = addMinutesToHhmm(cur, slotLen);
          if (compareHhmm(cur, wh.endTime) >= 0) break;
          continue;
        }
      }

      const conflictsAppt = blockingAppts.some((a) =>
        overlaps(cur, end, a.startTime, a.endTime)
      );

      // partial blocks only (full-day already returned above)
      const conflictsOff = timeOffForDate.some((t) =>
        overlaps(cur, end, t.startTime, t.endTime)
      );

      if (!conflictsAppt && !conflictsOff) {
        slots.push({ startTime: cur, endTime: end });
      }

      cur = addMinutesToHhmm(cur, slotLen);
      if (compareHhmm(cur, wh.endTime) >= 0) break;
    }

    return res.json({ slots });
  } catch (e) {
    next(e);
  }
}
