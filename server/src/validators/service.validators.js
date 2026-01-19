import { z } from "zod";

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),

  price: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().min(15).max(300),

  specialty: z.string().trim().min(1).max(40),

  active: z.coerce.boolean().optional().default(true),
});
