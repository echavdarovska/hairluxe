import { z } from "zod";

export const workingHoursItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isClosed: z.boolean().optional().default(false)
});

export const updateWorkingHoursSchema = z.object({
  workingHours: z.array(workingHoursItemSchema).min(7).max(7)
});

export const updateSlotLengthSchema = z.object({
  slotLengthMinutes: z.number().int().min(10).max(120)
});
