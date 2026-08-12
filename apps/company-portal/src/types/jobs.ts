import type { CurrencyCode } from "./common";
import type { StageType, TransitionRule } from "./settings";

export type JobStatus = "draft" | "published";

export type JobFormStep = 1 | 2 | 3 | 4 | 5 | 6;

export type JobWorkflowStage = {
  id: string;
  stageTemplateId?: string;
  aiAgentId?: string;
  name: string;
  type: StageType;
  colorHex: string;
  durationMinutes: number | null;
  transitionRule?: TransitionRule;
};

export type JobRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  skillKeywords: string[];
  atsKeywords: string[];
  expectedAtsScore: number;
  departmentId: string;
  designationId: string;
  experienceMinYears: number;
  experienceMaxYears: number;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: CurrencyCode;
  isPublic: boolean;
  status: JobStatus;
  workflowStages: JobWorkflowStage[];
  createdAt: string;
  updatedAt: string;
};

export type JobFormState = {
  title: string;
  description: string;
  skillKeywords: string[];
  atsKeywords: string[];
  expectedAtsScore: string;
  departmentId: string;
  designationId: string;
  experienceMinYears: string;
  experienceMaxYears: string;
  location: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: CurrencyCode;
  isPublic: boolean;
  status: JobStatus;
  workflowStages: JobWorkflowStage[];
};

export type InterviewStageType = "ai-interview" | "coding";
export type JobInterviewStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export type JobInterview = {
  id: string;
  candidateId: string;
  jobId: string;
  stage: InterviewStageType;
  status: JobInterviewStatus;
  startAt: string;
  durationMinutes: number;
  instructions: string;
  interviewLink: string;
  aiResult: string | null;
  createdAt: string;
  updatedAt: string;
};
