export type InterviewRoundType = "ai-interview" | "coding" | "human-interview" | "qa-evaluation";
export type InterviewStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export type Interview = {
  id: string;
  candidateId: string;
  roundType: InterviewRoundType;
  status: InterviewStatus;
  startAt: string;
  durationMinutes: number;
  instructions: string;
  interviewLink: string;
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
};
