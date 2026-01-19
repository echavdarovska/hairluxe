import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: "", maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15, max: 300 },

    specialty: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
      index: true,
    },

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

serviceSchema.index({ name: 1, specialty: 1 }, { unique: true });

export const Service = mongoose.model("Service", serviceSchema);
