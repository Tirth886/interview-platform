import { companyHttpClient } from './http';

export type CandidateStatus = 'pending' | 'active' | 'hold' | 'rejected' | 'selected';

export type CandidateAIEvaluation = {
  overallScore: number;
  atsScore: number;
  codingScore: number;
  communicationScore: number;
  domainScore: number;
  summary: string;
};

export type CandidateNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type CandidateTimelineEvent = {
  id: string;
  type: 'applied' | 'status' | 'automation' | 'note' | 'decision';
  label: string;
  detail: string;
  createdAt: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  resumeUrl: string;
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
  notes: CandidateNote[];
  timeline: CandidateTimelineEvent[];
  appliedAt: string;
  updatedAt: string;
};

export type CreateCandidatePayload = {
  phoneNumber: string;
  name?: string;
  email?: string;
};

export type UpdateCandidateStatusPayload = {
  status: CandidateStatus;
  detail?: string;
};

export type AddCandidateNotePayload = {
  text: string;
  author?: string;
};

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

const CANDIDATES_BASE_PATH = '/api/v1/candidates';

export const listCandidates = async (token: string): Promise<Candidate[]> => {
  try {
    const response = await companyHttpClient.get<
      ApiEnvelope<{ items: Candidate[]; pagination: { page: number; pageSize: number; total: number } }>
    >(`${CANDIDATES_BASE_PATH}?page=1&pageSize=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data.items;
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
        'Unable to load candidates right now. Please refresh and try again.'
    );
  }
};

export const createCandidate = async (
  payload: CreateCandidatePayload,
  token: string
): Promise<Candidate> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<{ candidate: Candidate }>>(
      CANDIDATES_BASE_PATH,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data.candidate;
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
        'Unable to create candidate right now. Please try again.'
    );
  }
};

export const updateCandidateStatus = async (
  candidateId: string,
  payload: UpdateCandidateStatusPayload,
  token: string
): Promise<Candidate> => {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ candidate: Candidate }>>(
      `${CANDIDATES_BASE_PATH}/${candidateId}/status`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data.candidate;
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
        'Unable to update candidate status right now. Please try again.'
    );
  }
};

export const addCandidateNote = async (
  candidateId: string,
  payload: AddCandidateNotePayload,
  token: string
): Promise<void> => {
  try {
    await companyHttpClient.post<ApiEnvelope<{ note: CandidateNote; candidateId: string }>>(
      `${CANDIDATES_BASE_PATH}/${candidateId}/notes`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
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
        'Unable to add candidate note right now. Please try again.'
    );
  }
};

export const runCandidateAutomation = async (
  candidateId: string,
  token: string
): Promise<void> => {
  try {
    await companyHttpClient.post<
      ApiEnvelope<{ candidate: Candidate; automation: { action: 'none' | 'status'; summary: string } }>
    >(
      `${CANDIDATES_BASE_PATH}/${candidateId}/run-automation`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
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
        'Unable to run automation right now. Please try again.'
    );
  }
};
