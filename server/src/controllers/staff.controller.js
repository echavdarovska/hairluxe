import { Staff } from "../models/Staff.js";
import { staffCreateSchema } from "../validators/staff.validators.js";

const STAFF_SERVICES_SELECT =
  "name category durationMinutes price active";

export async function listStaff(req, res, next) {
  try {
    const staff = await Staff.find({})
      .populate("services", STAFF_SERVICES_SELECT)
      .sort({ createdAt: -1 });

    res.json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function createStaff(req, res, next) {
  try {
    const data = staffCreateSchema.parse(req.body);

    const created = await Staff.create({
      name: data.name,
      active: data.active ?? true,
      services: data.services ?? [],
    });

    const staff = await Staff.findById(created._id)
      .populate("services", STAFF_SERVICES_SELECT);

    res.status(201).json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const data = staffCreateSchema.partial().parse(req.body);

    const update = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.active !== undefined) update.active = data.active;
    if (Array.isArray(data.services)) update.services = data.services;

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).populate("services", STAFF_SERVICES_SELECT);

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
