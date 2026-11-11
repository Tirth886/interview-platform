import { companyHttpClient } from './http';
import type { AiAgentConfig } from '../types/settings';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

export type CreateAiAgentPayload = {
  name: string;
  contextMarkdown: string;
  isEnabled?: boolean;
};

export type UpdateAiAgentPayload = Partial<CreateAiAgentPayload>;

const base = '/api/v1/ai-agents';

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

export async function listAiAgents(token: string): Promise<AiAgentConfig[]> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ items: AiAgentConfig[] }>>(base, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.items ?? [];
  } catch (error: unknown) {
    throw mapError(error, 'Unable to load AI agents right now.');
  }
}

export async function createAiAgent(
  payload: CreateAiAgentPayload,
  token: string
): Promise<AiAgentConfig> {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ agent: AiAgentConfig }>>(
      base,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.agent;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to create AI agent right now.');
  }
}

export async function updateAiAgent(
  agentId: string,
  payload: UpdateAiAgentPayload,
  token: string
): Promise<AiAgentConfig> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ agent: AiAgentConfig }>>(
      `${base}/${agentId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data.agent;
  } catch (error: unknown) {
    throw mapError(error, 'Unable to update AI agent right now.');
  }
}

export async function deleteAiAgent(agentId: string, token: string): Promise<void> {
  try {
    await companyHttpClient.delete<ApiEnvelope<{ ok: boolean }>>(`${base}/${agentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: unknown) {
    throw mapError(error, 'Unable to delete AI agent right now.');
  }
}
