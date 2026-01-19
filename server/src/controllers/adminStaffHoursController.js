import { Staff } from "../models/Staff.js";
import { StaffWorkingHours } from "../models/StaffWorkingHours.js";

export async function getStaffWorkingHours(req, res) {
  try {
    const { staffId } = req.params;

    const staff = await Staff.findById(staffId).select("_id name active").lean();
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const workingHours = await StaffWorkingHours.find({ staffId }).lean();
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

    if (!Array.isArray(workingHours)) {
      return res.status(400).json({ error: "workingHours must be an array" });
    }

    // basic normalization/validation
    for (const row of workingHours) {
      if (typeof row.dayOfWeek !== "number") {
        return res.status(400).json({ error: "dayOfWeek is required" });
      }
      if (!row.startTime || !row.endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }
    }

    // Replace-all strategy (simple + reliable)
    await StaffWorkingHours.deleteMany({ staffId });
    await StaffWorkingHours.insertMany(
      workingHours.map((r) => ({
        staffId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      }))
    );

    const saved = await StaffWorkingHours.find({ staffId }).lean();
    return res.json({ ok: true, workingHours: saved });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
