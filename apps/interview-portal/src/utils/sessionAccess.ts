import type { SessionAccessState, SessionValidationResult } from "../types/session";

export const toAccessError = (
  result: Extract<SessionValidationResult, { ok: false }>
): SessionAccessState => {
  if (result.reason === "session_expired") {
    return {
      status: "error",
      title: "Session Expired",
      message: result.message,
    };
  }

  if (result.reason === "session_not_found") {
    return {
      status: "error",
      title: "Session Not Found",
      message: result.message,
    };
  }

  if (result.reason === "role_not_allowed" || result.reason === "user_mismatch") {
    return {
      status: "error",
      title: "Access Denied",
      message: result.message,
    };
  }

  return {
    status: "error",
    title: "Invalid Interview Link",
    message: result.message,
  };
};
