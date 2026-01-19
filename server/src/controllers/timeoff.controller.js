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

/**
 * GET /api/admin/staff/:staffId/time-off
 */
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

/**
 * POST /api/admin/staff/:staffId/time-off
 * Body:
 * {
 *   startDate: "YYYY-MM-DD",
 *   endDate: "YYYY-MM-DD",
 *   reason?: string,
 *   startTime?: "HH:mm" | null,
 *   endTime?: "HH:mm" | null
 * }
 *
 * If startTime/endTime not provided => full day off.
 */
export async function createTimeOff(req, res, next) {
  try {
    const { staffId } = req.params;

    const startDate = String(req.body?.startDate || "");
    const endDate = String(req.body?.endDate || "");
    const reason = String(req.body?.reason || "").trim();

    // optional time range (partial day)
    const startTimeRaw = req.body?.startTime ?? null;
    const endTimeRaw = req.body?.endTime ?? null;

    if (!isISODate(startDate) || !isISODate(endDate)) {
      return res
        .status(400)
        .json({ message: "startDate and endDate must be YYYY-MM-DD" });
    }

    const range = normalizeRange(startDate, endDate);
    if (!range) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    let startTime =
      startTimeRaw === null || startTimeRaw === "" ? null : String(startTimeRaw);
    let endTime =
      endTimeRaw === null || endTimeRaw === "" ? null : String(endTimeRaw);

    // If one time is provided, require both
    if ((startTime && !endTime) || (!startTime && endTime)) {
      return res.status(400).json({
        message: "Provide both startTime and endTime, or neither for full-day off",
      });
    }

    // Validate HH:mm if provided
    if (startTime && endTime) {
      if (!isHHMM(startTime) || !isHHMM(endTime)) {
        return res.status(400).json({ message: "startTime/endTime must be HH:mm" });
      }
      if (endTime <= startTime) {
        return res
          .status(400)
          .json({ message: "endTime must be after startTime" });
      }
    }

    // ✅ staffId comes from URL, not body
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

/**
 * DELETE /api/admin/staff/:staffId/time-off/:timeOffId
 */
export async function deleteTimeOff(req, res, next) {
  try {
    const { staffId, timeOffId } = req.params;

    const deleted = await TimeOff.findOneAndDelete({
      _id: timeOffId,
      staffId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Time off entry not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
