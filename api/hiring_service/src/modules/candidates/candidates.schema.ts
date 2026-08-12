import { z } from 'zod';

const statusSchema = z.enum(['pending', 'active', 'hold', 'rejected', 'selected']);

const aiEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  atsScore: z.number().min(0).max(100),
  codingScore: z.number().min(0).max(100),
  communicationScore: z.number().min(0).max(100),
  domainScore: z.number().min(0).max(100),
  summary: z.string().min(1),
});

const phoneNumberSchema = z
  .string()
  .trim()
  .regex(/^[+]?[-()\d\s]{7,20}$/, 'Phone number must be a valid international/local format');

export const listCandidatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: statusSchema.optional(),
  atsResult: z.enum(['pass', 'fail']).optional(),
  sortBy: z.enum(['appliedAt', 'updatedAt', 'name', 'status']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const candidateIdParamsSchema = z.object({
  candidateId: z.string().uuid(),
});

export const updateCandidateStatusSchema = z.object({
  status: statusSchema,
  detail: z.string().trim().optional(),
});

export const addCandidateNoteSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  author: z.string().trim().min(1).max(100).optional(),
});

export const createCandidateSchema = z.object({
  phoneNumber: phoneNumberSchema,
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional(),
  resumeUrl: z.string().trim().optional(),
  experienceSummary: z.string().trim().optional(),
  profileKeywords: z.array(z.string().trim().min(1)).optional(),
  aiEvaluation: aiEvaluationSchema.optional(),
});

export const candidateImportSchema = z.object({
  items: z
    .array(
      z.object({
        phoneNumber: phoneNumberSchema.optional(),
        name: z.string().trim().min(1).optional(),
        email: z.string().email().optional(),
        resumeUrl: z.string().trim().optional(),
        experienceSummary: z.string().trim().optional(),
        profileKeywords: z.array(z.string().trim().min(1)).optional(),
        aiEvaluation: aiEvaluationSchema.optional(),
      })
    )
    .min(1),
});

export type ListCandidatesQueryInput = z.infer<typeof listCandidatesQuerySchema>;
export type CandidateIdParamsInput = z.infer<typeof candidateIdParamsSchema>;
export type UpdateCandidateStatusInput = z.infer<typeof updateCandidateStatusSchema>;
export type AddCandidateNoteInput = z.infer<typeof addCandidateNoteSchema>;
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type CandidateImportInput = z.infer<typeof candidateImportSchema>;
