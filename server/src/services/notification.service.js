import { Notification } from "../models/Notification.js";

export async function notify(userId, payload) {
  return Notification.create({
    userId,
    type: payload.type,
    title: payload.title,
    message: payload.message || "",
    appointmentId: payload.appointmentId || undefined
  });
}
