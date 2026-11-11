import { z } from 'zod';

export const scheduleTokenParamsSchema = z.object({
  token: z.string().uuid(),
});

export const submitScheduleSchema = z.object({
  startAt: z.string().datetime(),
});

export const createScheduleInviteSchema = z
  .object({
    workflowNodeId: z.string().uuid().optional(),
    resend: z.boolean().optional(),
  })
  .default({});

export const candidateIdParamsSchema = z.object({
  candidateId: z.string().uuid(),
});

export type ScheduleTokenParamsInput = z.infer<typeof scheduleTokenParamsSchema>;
export type SubmitScheduleInput = z.infer<typeof submitScheduleSchema>;
export type CreateScheduleInviteInput = z.infer<typeof createScheduleInviteSchema>;
