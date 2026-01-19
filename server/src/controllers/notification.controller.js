import { Notification } from "../models/Notification.js";

export async function listNotifications(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications: items });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!n) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.json({ notification: n });
  } catch (e) {
    next(e);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
