import type { InterviewStatus } from "./interviews";

export type SessionRole = "candidate";

export type InterviewSessionStatus = InterviewStatus;

export type InterviewSessionRecord = {
  id: string;
  title: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  aiInterviewerName: string;
  scheduledAt: string;
  expiresAt: string;
  durationMinutes: number;
  instructions: string;
  status: InterviewSessionStatus;
};

export type SessionValidationFailureReason =
  | "missing_session"
  | "missing_access_context"
  | "session_not_found"
  | "role_not_allowed"
  | "user_mismatch"
  | "session_expired";

export type SessionValidationResult =
  | { ok: true; session: InterviewSessionRecord; role: SessionRole; user: string }
  | { ok: false; reason: SessionValidationFailureReason; message: string };

export type SessionAccessState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; title: string; message: string };

export type CompatibilityCheckKey =
  | "browser_supported"
  | "secure_context"
  | "online"
  | "media_devices"
  | "camera_permission"
  | "screen_share_api";

export type CompatibilityCheck = {
  key: CompatibilityCheckKey;
  label: string;
  ok: boolean;
  detail: string;
};
