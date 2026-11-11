import { z } from 'zod';

export const bankIdParamsSchema = z.object({
  bankId: z.string().uuid(),
});

export const createQaBankSchema = z.object({
  name: z.string().trim().min(1).max(255),
});

export const updateQaBankSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
});

export const qaOptionSchema = z.object({
  id: z.string().uuid().optional(),
  optionText: z.string().max(20000),
  isCodeView: z.boolean().optional().default(false),
  isCorrect: z.boolean().optional().default(false),
  orderIndex: z.number().int().min(0).optional(),
});

export const qaQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  questionText: z.string().max(50000),
  isCodeView: z.boolean().optional().default(false),
  orderIndex: z.number().int().min(0).optional(),
  options: z.array(qaOptionSchema).min(2).max(12),
});

export const replaceQaQuestionsSchema = z.object({
  questions: z.array(qaQuestionSchema).max(200),
});

export type CreateQaBankInput = z.infer<typeof createQaBankSchema>;
export type UpdateQaBankInput = z.infer<typeof updateQaBankSchema>;
export type ReplaceQaQuestionsInput = z.infer<typeof replaceQaQuestionsSchema>;
export type BankIdParamsInput = z.infer<typeof bankIdParamsSchema>;
