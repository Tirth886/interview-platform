import type { InterviewSessionRecord } from "../types/session";

export const getSessionActivityPath = (
  sessionId: string,
  session?: Pick<InterviewSessionRecord, "sessionMode" | "roundType"> | null
): string => {
  if (session?.sessionMode === "qa-test" || session?.roundType === "qa-evaluation") {
    return `/session/${sessionId}/test`;
  }
  return `/session/${sessionId}/room`;
};
