import { Staff } from "../models/Staff.js";
import { Appointment } from "../models/Appointment.js";
import { StaffWorkingHours } from "../models/StaffWorkingHours.js";
import { StaffTimeOff } from "../models/StaffTimeOff.js";

function toDayOfWeekMon0(dateStr) {
  // JS getDay(): 0=Sun..6=Sat  -> convert to 0=Mon..6=Sun
  const js = new Date(dateStr + "T00:00:00").getDay();
  return (js + 6) % 7;
}

export async function getScheduleBoard(req, res) {
  try {
    const { date, staffIds } = req.query;
    if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

    const staffIdList = (staffIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const staffFilter = { active: true };
    if (staffIdList.length) staffFilter._id = { $in: staffIdList };

    const staff = await Staff.find(staffFilter).select("name specialties active").lean();
    const ids = staff.map((s) => s._id);

    const dayOfWeek = toDayOfWeekMon0(date);

    const [hours, timeOff, appts, pending] = await Promise.all([
      StaffWorkingHours.find({ staffId: { $in: ids }, dayOfWeek }).lean(),
      StaffTimeOff.find({ staffId: { $in: ids }, date }).lean(),
      Appointment.find({
        staffId: { $in: ids },
        date,
        status: { $in: ["PENDING_ADMIN_REVIEW", "CONFIRMED", "PROPOSED_TO_CLIENT"] },
      })
        .populate("serviceId", "name durationMinutes specialty")
        .populate("clientId", "name email")
        .lean(),
      Appointment.find({ date, status: "PENDING_ADMIN_REVIEW" })
        .populate("serviceId", "name durationMinutes specialty")
        .populate("clientId", "name email")
        .populate("staffId", "name")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const hoursByStaff = new Map(hours.map((h) => [String(h.staffId), h]));
    const apptsByStaff = new Map();
    const timeOffByStaff = new Map();

    for (const s of staff) {
      apptsByStaff.set(String(s._id), []);
      timeOffByStaff.set(String(s._id), []);
    }

    for (const a of appts) {
      const key = String(a.staffId);
      if (!apptsByStaff.has(key)) apptsByStaff.set(key, []);
      apptsByStaff.get(key).push(a);
    }

    for (const t of timeOff) {
      const key = String(t.staffId);
      if (!timeOffByStaff.has(key)) timeOffByStaff.set(key, []);
      timeOffByStaff.get(key).push(t);
    }

    return res.json({
      date,
      dayOfWeek,
      staff: staff.map((s) => ({
        ...s,
        workingHours: hoursByStaff.get(String(s._id))
          ? { startTime: hoursByStaff.get(String(s._id)).startTime, endTime: hoursByStaff.get(String(s._id)).endTime }
          : null,
        appointments: apptsByStaff.get(String(s._id)) || [],
        timeOff: timeOffByStaff.get(String(s._id)) || [],
      })),
      pending,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
