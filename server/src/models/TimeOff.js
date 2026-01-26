import mongoose from "mongoose";

const timeOffSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },


    startDate: {
      type: String,
      required: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      index: true,
    },


    startTime: {
      type: String,
      default: null,
    },
    endTime: {
      type: String,
      default: null,
    },

    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Efficient range queries
timeOffSchema.index({ staffId: 1, startDate: 1, endDate: 1 });

export const TimeOff = mongoose.model("TimeOff", timeOffSchema);
