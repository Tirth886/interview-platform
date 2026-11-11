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

export type CandidateLinks = {
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
};

export type CandidateWorkflowSummary = {
  id: string;
  workflowId: string;
  batchName: string | null;
  currentStageId: string | null;
  status: string;
  resumeUrl: string;
  appliedAt: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  resumeUrl: string;
  workflowId: string | null;
  batchName: string | null;
  currentJobTitle: string | null;
  currentStageId: string | null;
  latestParseId: string | null;
  latestAtsAttemptId: string | null;
  latestAtsScore: number | null;
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
  links: CandidateLinks;
  workflows: CandidateWorkflowSummary[];
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

export type BatchCreateCandidatesPayload = {
  workflowId: string;
  batchName: string;
  initialStageId?: string;
  resumes: Array<{
    key: string;
    url: string;
    fileName: string;
  }>;
};

export type BatchCreateCandidatesResult = {
  createdCount: number;
  failedCount: number;
  candidates: Candidate[];
  failures?: Array<{ index: number; fileName: string; reason: string }>;
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

export const batchCreateCandidates = async (
  payload: BatchCreateCandidatesPayload,
  token: string
): Promise<BatchCreateCandidatesResult> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<BatchCreateCandidatesResult>>(
      `${CANDIDATES_BASE_PATH}/batch`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
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
        'Unable to create candidates from resumes right now. Please try again.'
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

export const requestCandidateParse = async (
  candidateId: string,
  token: string
): Promise<Candidate> => {
  try {
    const response = await companyHttpClient.post<
      ApiEnvelope<{ queued: boolean; candidate: Candidate }>
    >(
      `${CANDIDATES_BASE_PATH}/${candidateId}/parse`,
      {},
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
        'Unable to queue resume parse right now. Please try again.'
    );
  }
};

export const getCandidateById = async (
  candidateId: string,
  token: string
): Promise<Candidate> => {
  try {
    const response = await companyHttpClient.get<ApiEnvelope<{ candidate?: Candidate } | Candidate>>(
      `${CANDIDATES_BASE_PATH}/${candidateId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data.data;
    if (data && typeof data === 'object' && 'candidate' in data && data.candidate) {
      return data.candidate;
    }
    return data as Candidate;
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
        'Unable to load candidate right now. Please try again.'
    );
  }
};

export const updateCandidateStage = async (
  candidateId: string,
  payload: { stageId: string; detail?: string },
  token: string
): Promise<Candidate> => {
  try {
    const response = await companyHttpClient.patch<ApiEnvelope<{ candidate: Candidate }>>(
      `${CANDIDATES_BASE_PATH}/${candidateId}/stage`,
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
        'Unable to update candidate stage right now. Please try again.'
    );
  }
};

export type ScheduleInviteResult = {
  invite: {
    token: string;
    status: string;
    stageLabel: string;
    stageDescription: string;
    roundType: string;
    durationMinutes: number;
    expiresAt: string;
    scheduledStartAt: string | null;
    candidateName: string;
    candidateEmail: string;
    companyName: string;
    scheduleUrl: string;
  };
  reused: boolean;
  email: {
    delivered: boolean;
    mode: 'resend' | 'console';
    to: string;
    scheduleUrl: string;
  };
};

export const sendCandidateScheduleInvite = async (
  candidateId: string,
  token: string,
  payload?: { workflowNodeId?: string; resend?: boolean }
): Promise<ScheduleInviteResult> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<ScheduleInviteResult>>(
      `${CANDIDATES_BASE_PATH}/${candidateId}/schedule-invite`,
      payload ?? {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.data;
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
        'Unable to send schedule invite right now. Please try again.'
    );
  }
};
