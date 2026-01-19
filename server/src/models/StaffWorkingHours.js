import mongoose from "mongoose";

const staffWorkingHoursSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6, index: true }, // 0=Mon ... 6=Sun (pick your convention)
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
  },
  { timestamps: true }
);

staffWorkingHoursSchema.index({ staffId: 1, dayOfWeek: 1 }, { unique: true });

export const StaffWorkingHours = mongoose.model("StaffWorkingHours", staffWorkingHoursSchema);
