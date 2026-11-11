import type { InterviewSessionRecord } from "../types/session";
import { interviewHttpClient } from "./http";

export type QaTestOption = {
  id: string;
  optionText: string;
  isCodeView: boolean;
};

export type QaTestQuestion = {
  id: string;
  questionText: string;
  isCodeView: boolean;
  options: QaTestOption[];
};

export type QaTestResult = {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
};

export type QaTestPayload = {
  bankId: string;
  questions: QaTestQuestion[];
  alreadySubmitted: boolean;
  result: QaTestResult | null;
};

type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data: T;
};

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

export const getQaTest = async (params: {
  sessionId: string;
  role?: string;
  user?: string | null;
}): Promise<{ session: InterviewSessionRecord; test: QaTestPayload }> => {
  const query = new URLSearchParams({ role: params.role ?? "candidate" });
  if (params.user) query.set("user", params.user);

  try {
    const response = await interviewHttpClient.get<
      ApiEnvelope<{ session: InterviewSessionRecord; test: QaTestPayload }>
    >(`/api/v1/interviews/session/${encodeURIComponent(params.sessionId)}/test?${query.toString()}`);
    return response.data.data;
  } catch (error: unknown) {
    throw mapError(error, "Unable to load Q&A test.");
  }
};

export const submitQaTest = async (params: {
  sessionId: string;
  role?: string;
  user?: string | null;
  answers: Array<{ questionId: string; optionId: string }>;
}): Promise<{ session: InterviewSessionRecord; result: QaTestResult }> => {
  const query = new URLSearchParams({ role: params.role ?? "candidate" });
  if (params.user) query.set("user", params.user);

  try {
    const response = await interviewHttpClient.post<
      ApiEnvelope<{ session: InterviewSessionRecord; result: QaTestResult }>
    >(
      `/api/v1/interviews/session/${encodeURIComponent(params.sessionId)}/test/submit?${query.toString()}`,
      { answers: params.answers }
    );
    return response.data.data;
  } catch (error: unknown) {
    throw mapError(error, "Unable to submit Q&A test.");
  }
};
