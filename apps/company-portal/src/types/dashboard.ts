export type CandidateStage = "applied" | "screening" | "interview" | "selected";

export type DashboardInterviewStatus = "in-progress" | "completed";

export type ActivityType =
  | "new_application"
  | "interview_completed"
  | "candidate_moved"
  | "ai_auto_screened"
  | "ai_shortlisted";

export type DashboardCandidate = {
  id: string;
  name: string;
  stage: CandidateStage;
  appliedAt: string;
};

export type DashboardInterview = {
  id: string;
  candidateId: string;
  status: DashboardInterviewStatus;
  startedAt: string;
};

export type DashboardActivity = {
  id: string;
  type: ActivityType;
  text: string;
  createdAt: string;
  count?: number;
};
