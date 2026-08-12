import { interviewHttpClient } from "./http";
import type { Interview } from "../types/interviews";

export type { Interview, InterviewRoundType, InterviewStatus } from "../types/interviews";

type ApiEnvelope<T> = {
  status: "success" | "error";
  message: string;
  data: T;
};

const base = "/api/v1/interviews";

/**
 * Fetch candidate's interviews by email (no auth required)
 * Called from interview portal session preboarding
 */
export async function listInterviewsByEmail(email: string): Promise<Interview[]> {
  try {
    const params = new URLSearchParams({ email });
    const response = await interviewHttpClient.get<ApiEnvelope<{ items: Interview[] }>>(
      `${base}/by-email?${params.toString()}`
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
      httpError.response?.data?.message ?? "Unable to load interviews right now."
    );
  }
}
