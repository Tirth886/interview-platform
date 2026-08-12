import type { SessionRole, SessionValidationResult } from "../types/session";
import { interviewHttpClient } from "./http";

export const validateSessionAccess = async (params: {
  sessionId?: string;
  role?: string;
  user?: string;
}): Promise<SessionValidationResult> => {
  const sessionId = params.sessionId?.trim();
  if (!sessionId) {
    return {
      ok: false,
      reason: "missing_session",
      message: "Missing interview session id in the link.",
    };
  }

  const role = (params.role?.trim().toLowerCase() ?? "candidate") as SessionRole | "";
  const user = params.user?.trim().toLowerCase();

  if (!role || role !== "candidate") {
    return {
      ok: false,
      reason: "missing_access_context",
      message: "Missing or invalid access context in the interview link. Only candidates can access this portal.",
    };
  }

  const queryString = new URLSearchParams({ role });
  if (user) {
    queryString.set("user", user);
  }

  try {
    const response = await interviewHttpClient.get(
      `/api/v1/interviews/session/${encodeURIComponent(sessionId)}?${queryString.toString()}`
    );

    if (response.data?.status === "success") {
      return {
        ok: true,
        session: response.data.data.session,
        role: response.data.data.role,
        user: response.data.data.user,
      };
    }

    return {
      ok: false,
      reason: "session_not_found",
      message: response.data?.message ?? "Interview session is invalid or does not exist.",
    };
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return {
      ok: false,
      reason: "session_not_found",
      message:
        httpError.response?.data?.message ??
        "Unable to validate interview session right now. Please try again.",
    };
  }
};

export const joinInterviewSession = async (params: {
  sessionId?: string;
  role?: string;
  user?: string;
}): Promise<SessionValidationResult> => {
  const sessionId = params.sessionId?.trim();
  if (!sessionId) {
    return {
      ok: false,
      reason: "missing_session",
      message: "Missing interview session id in the link.",
    };
  }

  const role = (params.role?.trim().toLowerCase() ?? "candidate") as SessionRole | "";
  const user = params.user?.trim().toLowerCase();

  if (!role || role !== "candidate") {
    return {
      ok: false,
      reason: "missing_access_context",
      message: "Missing or invalid access context in the interview link. Only candidates can access this portal.",
    };
  }

  const queryString = new URLSearchParams({ role });
  if (user) {
    queryString.set("user", user);
  }

  try {
    const response = await interviewHttpClient.patch(
      `/api/v1/interviews/session/${encodeURIComponent(sessionId)}/join?${queryString.toString()}`
    );

    if (response.data?.status === "success") {
      return {
        ok: true,
        session: response.data.data.session,
        role: response.data.data.role,
        user: response.data.data.user,
      };
    }

    return {
      ok: false,
      reason: "session_not_found",
      message: response.data?.message ?? "Unable to join the interview session.",
    };
  } catch (error: unknown) {
    const httpError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return {
      ok: false,
      reason: "session_not_found",
      message:
        httpError.response?.data?.message ??
        "Unable to join the interview session right now. Please try again.",
    };
  }
};
