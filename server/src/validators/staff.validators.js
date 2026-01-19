import { z } from "zod";

// Mongo ObjectId validator (24 hex chars)
const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid service id");

export const staffCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),

  specialties: z.array(objectId).default([]),

  active: z.boolean().default(true),
});
