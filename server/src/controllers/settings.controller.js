import { Settings } from "../models/Settings.js";
import { updateWorkingHoursSchema, updateSlotLengthSchema } from "../validators/settings.validators.js";

async function getOrCreateSettings() {
  let s = await Settings.findOne({});
  if (!s) {
    s = await Settings.create({
      slotLengthMinutes: 30,
      workingHours: [
        { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isClosed: true },
        { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isClosed: false },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isClosed: false },
        { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isClosed: false },
        { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isClosed: false },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isClosed: false },
        { dayOfWeek: 6, startTime: "10:00", endTime: "14:00", isClosed: false }
      ]
    });
  }
  return s;
}

export async function getWorkingHours(req, res, next) {
  try {
    const s = await getOrCreateSettings();
    res.json({ workingHours: s.workingHours });
  } catch (e) {
    next(e);
  }
}

export async function updateWorkingHours(req, res, next) {
  try {
    const data = updateWorkingHoursSchema.parse(req.body);
    const s = await getOrCreateSettings();
    s.workingHours = data.workingHours;
    await s.save();
    res.json({ workingHours: s.workingHours });
  } catch (e) {
    next(e);
  }
}

export async function getSlotLength(req, res, next) {
  try {
    const s = await getOrCreateSettings();
    res.json({ slotLengthMinutes: s.slotLengthMinutes });
  } catch (e) {
    next(e);
  }
}

export async function updateSlotLength(req, res, next) {
  try {
    const data = updateSlotLengthSchema.parse(req.body);
    const s = await getOrCreateSettings();
    s.slotLengthMinutes = data.slotLengthMinutes;
    await s.save();
    res.json({ slotLengthMinutes: s.slotLengthMinutes });
  } catch (e) {
    next(e);
  }
}

export { getOrCreateSettings };
