import { interviewHttpClient } from "./http";

export type PublicScheduleInvite = {
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

export type SubmitScheduleResult = {
  invite: {
    token: string;
    status: string;
    stageLabel: string;
    stageDescription: string;
    roundType: string;
    durationMinutes: number;
    scheduledStartAt: string;
    companyName: string;
    sessionUrl: string;
  };
  interview: {
    id: string;
    startAt: string;
    durationMinutes: number;
    interviewLink: string;
    status: string;
    roundType: string;
  };
};

type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data: T;
};

const base = "/api/v1/schedule-invites";

export const getScheduleInvite = async (token: string): Promise<PublicScheduleInvite> => {
  try {
    const response = await interviewHttpClient.get<ApiEnvelope<{ invite: PublicScheduleInvite }>>(
      `${base}/${encodeURIComponent(token)}`
    );
    return response.data.data.invite;
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };
    throw new Error(httpError.response?.data?.message ?? "Unable to load schedule invite.");
  }
};

export const submitScheduleInvite = async (
  token: string,
  startAt: string
): Promise<SubmitScheduleResult> => {
  try {
    const response = await interviewHttpClient.post<ApiEnvelope<SubmitScheduleResult>>(
      `${base}/${encodeURIComponent(token)}`,
      { startAt }
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
    throw new Error(httpError.response?.data?.message ?? "Unable to submit schedule.");
  }
};
