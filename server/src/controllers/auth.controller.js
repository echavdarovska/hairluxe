import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { registerSchema, loginSchema } from "../validators/auth.validators.js";

function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email });
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "client",
    });

    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const token = signToken(user._id.toString(), user.role);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res) {

  res.json({ user: req.user });
}

export async function logout(req, res) {

  res.json({ ok: true });
}
