import { z } from "zod";

export const createAppointmentSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  clientNote: z.string().max(500).optional().default("")
});

export const declineSchema = z.object({
  reason: z.string().min(2).max(300)
});

export const proposeSchema = z.object({
  staffId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().max(500).optional().default("")
});

export const rejectProposalSchema = z.object({
  message: z.string().max(500).optional().default("")
});

export const statusUpdateSchema = z.object({
  status: z.enum(["COMPLETED", "NO_SHOW"])
});
