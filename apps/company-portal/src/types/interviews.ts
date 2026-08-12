import type { InterviewRoundType } from "../services/interviews";

export type DialogMode = "create" | "reschedule" | "cancel";
export type DashboardView = "list" | "calendar" | "kanban";
export type CalendarMode = "day" | "week" | "month";

export type InterviewFormData = {
  candidateId: string;
  roundType: InterviewRoundType;
  startAtLocal: string;
  durationMinutes: string;
  instructions: string;
};
