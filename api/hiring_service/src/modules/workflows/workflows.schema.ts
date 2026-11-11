import { z } from 'zod';

const flowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.record(z.unknown()),
  style: z.record(z.unknown()).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const flowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});

const stageAssignmentSchema = z.object({
  stageId: z.string().min(1),
  aiAgentId: z.string().optional(),
});

export const workflowIdParamsSchema = z.object({
  workflowId: z.string().uuid(),
});

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(255),
  designationId: z.string().trim().max(100).optional().default(''),
  jobDescriptionFileName: z.string().trim().min(1),
  jobDescriptionUrl: z.string().trim().min(1),
  jobDescriptionKey: z.string().trim().min(1),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
  stages: z.array(stageAssignmentSchema).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  designationId: z.string().trim().max(100).optional(),
  jobDescriptionFileName: z.string().trim().min(1).optional(),
  jobDescriptionUrl: z.string().trim().min(1).optional(),
  jobDescriptionKey: z.string().trim().min(1).optional(),
  nodes: z.array(flowNodeSchema).optional(),
  edges: z.array(flowEdgeSchema).optional(),
  stages: z.array(stageAssignmentSchema).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type WorkflowIdParamsInput = z.infer<typeof workflowIdParamsSchema>;
