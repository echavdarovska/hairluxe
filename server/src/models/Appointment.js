import mongoose from "mongoose";

const proposedSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    date: { type: String }, // YYYY-MM-DD
    startTime: { type: String },
    endTime: { type: String },
    message: { type: String, default: "" }
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },

    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true },   // HH:MM

    status: {
      type: String,
      enum: [
        "PENDING_ADMIN_REVIEW",
        "CONFIRMED",
        "DECLINED",
        "PROPOSED_TO_CLIENT",
        "CLIENT_REJECTED_PROPOSAL",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW"
      ],
      default: "PENDING_ADMIN_REVIEW",
      index: true
    },

    declineReason: { type: String, default: "" },
    adminNote: { type: String, default: "" },
    clientNote: { type: String, default: "" },

    proposed: { type: proposedSchema, default: null }
  },
  { timestamps: true }
);

// Helps with lookups and filtering
appointmentSchema.index({ staffId: 1, date: 1, status: 1 });
appointmentSchema.index({ date: 1, status: 1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
