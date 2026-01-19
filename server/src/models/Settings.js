import mongoose from "mongoose";

const workingHoursSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true },   // HH:MM
    isClosed: { type: Boolean, default: false }
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    slotLengthMinutes: { type: Number, default: 30, min: 10, max: 120 },
    workingHours: { type: [workingHoursSchema], default: [] }
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", settingsSchema);
