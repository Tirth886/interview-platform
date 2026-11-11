import type { InterviewRoundType, InterviewStatus } from "../services/interviews";

export const statusVariant: Record<
  InterviewStatus,
  "secondary" | "warning" | "success" | "destructive"
> = {
  scheduled: "secondary",
  "in-progress": "warning",
  completed: "success",
  cancelled: "destructive",
};

export const roundTypeLabel: Record<InterviewRoundType, string> = {
  "ai-interview": "AI Interview",
  coding: "Coding Interview",
  "human-interview": "Human Interview",
  "qa-evaluation": "Q&A Evaluation",
};
