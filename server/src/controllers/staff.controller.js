import { Staff } from "../models/Staff.js";
import { staffCreateSchema } from "../validators/staff.validators.js";

const STAFF_SPECIALTIES_SELECT =
  "name specialty category durationMinutes price active";

export async function listStaff(req, res, next) {
  try {
    const staff = await Staff.find({})
      .populate("specialties", STAFF_SPECIALTIES_SELECT)
      .sort({ createdAt: -1 });

    res.json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function createStaff(req, res, next) {
  try {
    const data = staffCreateSchema.parse(req.body);
    const created = await Staff.create(data);

    const staff = await Staff.findById(created._id).populate(
      "specialties",
      STAFF_SPECIALTIES_SELECT
    );

    res.status(201).json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const data = staffCreateSchema.partial().parse(req.body);

    const staff = await Staff.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true, // IMPORTANT: enforce mongoose validation on updates too
    }).populate("specialties", STAFF_SPECIALTIES_SELECT);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
