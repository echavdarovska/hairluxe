import { Staff } from "../models/Staff.js";
import { StaffWorkingHours } from "../models/StaffWorkingHours.js";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function hhmmToMin(t) {
  const [h, m] = String(t).split(":").map(Number);
  return h * 60 + m;
}

export async function getStaffWorkingHours(req, res) {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId).select("_id name active").lean();
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const workingHours = await StaffWorkingHours.find({ staffId }).sort({ dayOfWeek: 1 }).lean();
    return res.json({ staff, workingHours });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function putStaffWorkingHours(req, res) {
  try {
    const { staffId } = req.params;
    const { workingHours } = req.body;

    // Replace-all strategy: delete + insert keeps the dataset consistent.
    if (!Array.isArray(workingHours)) {
      return res.status(400).json({ error: "workingHours must be an array" });
    }

    const staff = await Staff.findById(staffId).select("_id").lean();
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const seen = new Set();
    for (const row of workingHours) {
      const dow = row?.dayOfWeek;
      const start = row?.startTime;
      const end = row?.endTime;

      if (typeof dow !== "number" || dow < 0 || dow > 6) {
        return res.status(400).json({ error: "dayOfWeek must be a number 0..6 (Mon=0..Sun=6)" });
      }
      if (seen.has(dow)) {
        return res.status(400).json({ error: `Duplicate dayOfWeek: ${dow}` });
      }
      seen.add(dow);

      if (!HHMM.test(String(start)) || !HHMM.test(String(end))) {
        return res.status(400).json({ error: "startTime/endTime must be HH:mm" });
      }
      if (hhmmToMin(start) >= hhmmToMin(end)) {
        return res.status(400).json({ error: "startTime must be before endTime" });
      }
    }

    await StaffWorkingHours.deleteMany({ staffId });
    await StaffWorkingHours.insertMany(
      workingHours.map((r) => ({
        staffId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      }))
    );

    const saved = await StaffWorkingHours.find({ staffId }).sort({ dayOfWeek: 1 }).lean();
    return res.json({ ok: true, workingHours: saved }); // returns normalized data
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
