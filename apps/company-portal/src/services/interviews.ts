import { companyHttpClient } from './http';

export type InterviewRoundType = 'ai-interview' | 'coding' | 'human-interview' | 'qa-evaluation';
export type InterviewStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Interview {
  id: string;
  candidateId: string;
  roundType: InterviewRoundType;
  status: InterviewStatus;
  startAt: string;
  durationMinutes: number;
  instructions: string;
  interviewLink: string;
  qaBankId?: string | null;
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewPayload {
  candidateId: string;
  roundType: InterviewRoundType;
  startAt: string;
  durationMinutes: number;
  instructions: string;
}

export interface RescheduleInterviewPayload {
  startAt: string;
  durationMinutes: number;
}

export interface UpdateInterviewStatusPayload {
  status: InterviewStatus;
  aiResult?: string;
}

export interface InterviewListFilters {
  from?: string;
  to?: string;
  candidateId?: string;
  status?: InterviewStatus;
  roundType?: InterviewRoundType;
}

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

const base = "/api/v1/interviews";

export async function listInterviews(
  filters?: InterviewListFilters,
  token?: string
): Promise<Interview[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.from) params.append("from", filters.from);
    if (filters?.to) params.append("to", filters.to);
    if (filters?.candidateId) params.append("candidateId", filters.candidateId);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.roundType) params.append("roundType", filters.roundType);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await companyHttpClient.get<ApiEnvelope<{ items: Interview[] }>>(
      `${base}${query}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.items ?? [];
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to load interviews right now. Please refresh and try again.'
    );
  }
}

export async function createInterview(
  payload: CreateInterviewPayload,
  token?: string
): Promise<Interview> {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ interview: Interview }>>(
      base,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.interview;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to create interview right now. Please try again.'
    );
  }
}

export async function getInterviewById(
  interviewId: string,
  token?: string
): Promise<Interview> {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ interview: Interview }>>(
      `${base}/${interviewId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.interview;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to fetch interview details right now. Please try again.'
    );
  }
}

export async function rescheduleInterview(
  interviewId: string,
  payload: RescheduleInterviewPayload,
  token?: string
): Promise<Interview> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ interview: Interview }>>(
      `${base}/${interviewId}/reschedule`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.interview;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to reschedule interview right now. Please try again.'
    );
  }
}

export async function cancelInterview(interviewId: string, token?: string): Promise<Interview> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ interview: Interview }>>(
      `${base}/${interviewId}/cancel`,
      {},
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.interview;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to cancel interview right now. Please try again.'
    );
  }
}

export async function updateInterviewStatus(
  interviewId: string,
  payload: UpdateInterviewStatusPayload,
  token?: string
): Promise<Interview> {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ interview: Interview }>>(
      `${base}/${interviewId}/status`,
      payload,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    return response.data.data.interview;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    throw new Error(
      httpError.response?.data?.message ??
        'Unable to update interview status right now. Please try again.'
    );
  }
}
