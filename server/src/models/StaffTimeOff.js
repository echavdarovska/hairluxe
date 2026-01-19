import mongoose from "mongoose";

const staffTimeOffSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
    startTime: { type: String, required: true }, // "HH:MM"
    endTime: { type: String, required: true },   // "HH:MM"
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

staffTimeOffSchema.index({ staffId: 1, date: 1 });

export const StaffTimeOff = mongoose.model("StaffTimeOff", staffTimeOffSchema);
