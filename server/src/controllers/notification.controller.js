import { Notification } from "../models/Notification.js";

export async function listNotifications(req, res, next) {
  try {
    const items = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ notifications: items });
  } catch (e) {
    next(e);
  }
}

export async function markRead(req, res, next) {
  try {
    // Ensures users can only mark their own notifications as read
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!n) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification: n });
  } catch (e) {
    next(e);
  }
}

export async function markAllRead(req, res, next) {
  try {
    // Bulk update for UX performance (no per-item requests)
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}
