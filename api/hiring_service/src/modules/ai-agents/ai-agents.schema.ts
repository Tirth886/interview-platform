import { z } from 'zod';

export const agentIdParamsSchema = z.object({
  agentId: z.string().uuid(),
});

export const createAiAgentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  contextMarkdown: z.string().max(50000).optional().default(''),
  isEnabled: z.boolean().optional().default(true),
});

export const updateAiAgentSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  contextMarkdown: z.string().max(50000).optional(),
  isEnabled: z.boolean().optional(),
});

export type CreateAiAgentInput = z.infer<typeof createAiAgentSchema>;
export type UpdateAiAgentInput = z.infer<typeof updateAiAgentSchema>;
export type AgentIdParamsInput = z.infer<typeof agentIdParamsSchema>;
