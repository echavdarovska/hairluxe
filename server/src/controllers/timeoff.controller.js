import { TimeOff } from "../models/TimeOff.js";

function isISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
function isHHMM(s) {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
function normalizeRange(startDate, endDate) {
  const a = new Date(`${startDate}T00:00:00`);
  const b = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  if (b < a) return { startDate: endDate, endDate: startDate };
  return { startDate, endDate };
}

export async function listTimeOff(req, res, next) {
  try {
    const { staffId } = req.params;

    const items = await TimeOff.find({ staffId })
      .sort({ startDate: -1, createdAt: -1 })
      .lean();

    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function createTimeOff(req, res, next) {
  try {
    const { staffId } = req.params;

    const startDate = String(req.body?.startDate || "");
    const endDate = String(req.body?.endDate || "");
    const reason = String(req.body?.reason || "").trim();

    const startTimeRaw = req.body?.startTime ?? null;
    const endTimeRaw = req.body?.endTime ?? null;

    if (!isISODate(startDate) || !isISODate(endDate)) {
      return res.status(400).json({ message: "startDate and endDate must be YYYY-MM-DD" });
    }

    const range = normalizeRange(startDate, endDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    let startTime =
      startTimeRaw === null || startTimeRaw === "" ? null : String(startTimeRaw);
    let endTime =
      endTimeRaw === null || endTimeRaw === "" ? null : String(endTimeRaw);

    // Full-day off when no times are provided; partial-day off requires both times.
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return res.status(400).json({
        message: "Provide both startTime and endTime, or neither for full-day off",
      });
    }

    if (startTime && endTime) {
      if (!isHHMM(startTime) || !isHHMM(endTime)) {
        return res.status(400).json({ message: "startTime/endTime must be HH:mm" });
      }
      if (endTime <= startTime) {
        return res.status(400).json({ message: "endTime must be after startTime" });
      }
    }

    const created = await TimeOff.create({
      staffId,
      startDate: range.startDate,
      endDate: range.endDate,
      startTime,
      endTime,
      reason,
    });

    res.status(201).json({ item: created });
  } catch (e) {
    next(e);
  }
}

export async function deleteTimeOff(req, res, next) {
  try {
    const { staffId, timeOffId } = req.params;

    // Scoped delete: prevents deleting someone else’s time-off by id.
    const deleted = await TimeOff.findOneAndDelete({ _id: timeOffId, staffId });

    if (!deleted) {
      return res.status(404).json({ message: "Time off entry not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
