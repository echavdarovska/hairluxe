import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      res.status(401);
      throw new Error("Missing token");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.sub).select("_id name email role");
    if (!user) {
      res.status(401);
      throw new Error("Invalid token user");
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401);
    next(e);
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authenticated"));
    }
    if (req.user.role !== role) {
      res.status(403);
      return next(new Error("Forbidden"));
    }
    next();
  };
}
