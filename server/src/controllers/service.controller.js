import { Service } from "../models/Service.js";
import { serviceCreateSchema } from "../validators/service.validators.js";

export async function listServices(req, res, next) {
  try {
    const services = await Service.find({})
      .sort({ createdAt: -1 })
      .lean();
    res.json({ services });
  } catch (e) {
    next(e);
  }
}

export async function createService(req, res, next) {
  try {
    const data = serviceCreateSchema.parse(req.body);
    const service = await Service.create(data);
    res.status(201).json({ service });
  } catch (e) {
    next(e);
  }
}

export async function updateService(req, res, next) {
  try {
    const data = serviceCreateSchema.partial().parse(req.body);

    const service = await Service.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true, // make sure mongoose validates updates too
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ service });
  } catch (e) {
    next(e);
  }
}

export async function deleteService(req, res, next) {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
