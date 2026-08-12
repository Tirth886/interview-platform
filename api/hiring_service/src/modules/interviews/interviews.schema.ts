import { z } from 'zod';

const statusSchema = z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']);
const roundTypeSchema = z.enum(['ai-interview', 'coding']);

export const listInterviewsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  candidateId: z.string().uuid().optional(),
  status: statusSchema.optional(),
  roundType: roundTypeSchema.optional(),
});

export const createInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  roundType: roundTypeSchema,
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(360),
  instructions: z.string().trim().min(1).max(5000),
});

export const interviewIdParamsSchema = z.object({
  interviewId: z.string().uuid(),
});

export const interviewSessionParamsSchema = z.object({
  sessionId: z.string().uuid(),
});

export const sessionValidationQuerySchema = z.object({
  role: z.enum(['candidate']).optional(),
  user: z.string().email().trim().optional(),
});

export const rescheduleInterviewSchema = z.object({
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(360),
});

export const updateInterviewStatusSchema = z.object({
  status: statusSchema,
  aiResult: z.string().trim().min(1).max(10000).optional(),
});

export type ListInterviewsQueryInput = z.infer<typeof listInterviewsQuerySchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type InterviewIdParamsInput = z.infer<typeof interviewIdParamsSchema>;
export type InterviewSessionParamsInput = z.infer<typeof interviewSessionParamsSchema>;
export type RescheduleInterviewInput = z.infer<typeof rescheduleInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
