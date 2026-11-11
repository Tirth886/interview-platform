import { companyHttpClient } from './http';
import type { StageTemplate } from '../types/settings';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

export type StageApiItem = StageTemplate & {
  stageType: string;
  isEnabled: boolean;
  isSystem: boolean;
  code: string;
  icon: string;
  updatedAt?: string;
};

const base = '/api/v1/stages';

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

/** Platform catalog — read-only for company portal. */
export async function listStages(token: string): Promise<StageApiItem[]> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ items: StageApiItem[] }>>(base, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.items ?? [];
  } catch (error: unknown) {
    throw mapError(error, 'Unable to load stages right now.');
  }
}
