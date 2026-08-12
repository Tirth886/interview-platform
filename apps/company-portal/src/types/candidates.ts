export type CandidateEvaluation = {
  overallScore: number;
  atsScore: number;
  codingScore: number;
  communicationScore: number;
  domainScore: number;
  summary: string;
};

export type CandidateAutomationStatus =
  | "pending"
  | "active"
  | "hold"
  | "rejected"
  | "selected";

export type JobCandidateStatus = CandidateAutomationStatus;

export type CandidateAutomationResult = {
  action: "none" | "advance" | "hold" | "reject" | "select";
  nextStageId?: string;
  status?: CandidateAutomationStatus;
  summary: string;
};

export type CandidateTimelineEvent = {
  id: string;
  type: "applied" | "stage" | "status" | "automation" | "note" | "decision";
  label: string;
  detail: string;
  createdAt: string;
};

export type CandidateNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

export type JobCandidate = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  resumeUrl: string;
  experienceSummary: string;
  profileKeywords: string[];
  status: JobCandidateStatus;
  aiEvaluation: CandidateEvaluation;
  finalDecision: string | null;
  notes: CandidateNote[];
  timeline: CandidateTimelineEvent[];
  currentStageId: string;
  appliedAt: string;
  updatedAt: string;
};
