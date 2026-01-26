import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    services: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Service", index: true },
    ],
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Staff = mongoose.model("Staff", staffSchema);
