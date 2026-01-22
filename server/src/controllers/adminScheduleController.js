import { Staff } from "../models/Staff.js";
import { Appointment } from "../models/Appointment.js";
import { StaffWorkingHours } from "../models/StaffWorkingHours.js";
import { StaffTimeOff } from "../models/StaffTimeOff.js";

function toDayOfWeekMon0(dateStr) {
  const js = new Date(dateStr + "T00:00:00").getDay(); // JS: 0=Sun..6=Sat
  return (js + 6) % 7; // App: 0=Mon..6=Sun
}

export async function getScheduleBoard(req, res) {
  try {
    const { date, staffIds } = req.query;

    if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({ error: "date must be YYYY-MM-DD" });
    }

    const staffIdList = String(staffIds || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const staffFilter = { active: true };
    if (staffIdList.length) staffFilter._id = { $in: staffIdList };

    const staff = await Staff.find(staffFilter).select("name specialties active").lean();
    const ids = staff.map((s) => s._id);
    const dayOfWeek = toDayOfWeekMon0(date);

    // Uses per-staff working hours (StaffWorkingHours) as the source of truth.
    const [hours, timeOff, appts, pending] = await Promise.all([
      StaffWorkingHours.find({ staffId: { $in: ids }, dayOfWeek }).lean(),
      StaffTimeOff.find({ staffId: { $in: ids }, date }).lean(),
      Appointment.find({
        staffId: { $in: ids },
        date,
        status: { $in: ["PENDING_ADMIN_REVIEW", "CONFIRMED", "PROPOSED_TO_CLIENT"] },
      })
        .populate("serviceId", "name durationMinutes")
        .populate("clientId", "name email")
        .lean(),
      Appointment.find({ date, status: "PENDING_ADMIN_REVIEW" })
        .populate("serviceId", "name durationMinutes")
        .populate("clientId", "name email")
        .populate("staffId", "name")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const hoursByStaff = new Map();
    for (const h of hours) hoursByStaff.set(String(h.staffId), h);

    const apptsByStaff = new Map(staff.map((s) => [String(s._id), []]));
    for (const a of appts) apptsByStaff.get(String(a.staffId))?.push(a);

    const timeOffByStaff = new Map(staff.map((s) => [String(s._id), []]));
    for (const t of timeOff) timeOffByStaff.get(String(t.staffId))?.push(t);

    return res.json({
      date,
      dayOfWeek,
      staff: staff.map((s) => {
        const h = hoursByStaff.get(String(s._id));
        return {
          ...s,
          workingHours: h ? { startTime: h.startTime, endTime: h.endTime } : null,
          appointments: apptsByStaff.get(String(s._id)) || [],
          timeOff: timeOffByStaff.get(String(s._id)) || [],
        };
      }),
      pending, // Global pending queue for the day (used for review list)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
