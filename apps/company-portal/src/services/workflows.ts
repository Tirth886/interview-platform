import { companyHttpClient } from './http';
import type {
  CreateWorkflowPayload,
  HiringWorkflow,
  WorkflowFlowEdge,
  WorkflowFlowNode,
  WorkflowStageAssignment,
} from '../types/settings';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

const base = '/api/v1/workflows';

const mapError = (error: unknown, fallback: string): Error => {
  const httpError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };
  return new Error(httpError.response?.data?.message ?? fallback);
};

export async function listWorkflows(token: string): Promise<HiringWorkflow[]> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ items: HiringWorkflow[] }>>(base, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.items ?? [];
  } catch (error: unknown) {
    throw mapError(error, 'Unable to load workflows right now.');
  }
}

export async function createWorkflow(
  payload: CreateWorkflowPayload,
  token: string
): Promise<HiringWorkflow> {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ workflow: HiringWorkflow }>>(
      base,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data.workflow;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to create workflow right now.');
  }
}

export async function updateWorkflow(
  workflowId: string,
  payload: Partial<{
    name: string;
    designationId: string;
    nodes: WorkflowFlowNode[];
    edges: WorkflowFlowEdge[];
    stages: WorkflowStageAssignment[];
    jobDescriptionFileName: string;
    jobDescriptionUrl: string;
    jobDescriptionKey: string;
  }>,
  token: string
): Promise<HiringWorkflow> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ workflow: HiringWorkflow }>>(
      `${base}/${workflowId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data.data.workflow;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to update workflow right now.');
  }
}

export async function deleteWorkflow(workflowId: string, token: string): Promise<void> {
  try {
    await companyHttpClient.delete<ApiEnvelope<{ ok: boolean }>>(`${base}/${workflowId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: unknown) {
    throw mapError(error, 'Unable to delete workflow right now.');
  }
}
