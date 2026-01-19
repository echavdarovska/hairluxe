import { z } from "zod";

/**
 * Shared email schema
 * - trims
 * - validates format
 * - normalizes casing
 */
const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .transform((v) => v.toLowerCase());

/**
 * Strong password:
 * - min 8 chars
 * - at least 1 uppercase
 * - at least 1 number
 */
const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),

  email: emailSchema,

  password: strongPassword,
});

export const loginSchema = z.object({
  email: emailSchema,

  // DO NOT enforce strength on login
  // only presence + basic length
  password: z.string().min(1, "Password is required"),
});
