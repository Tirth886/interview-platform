import type { CandidateStatus } from '../../types/common';

export type { CandidateStatus };

export type CandidateTimelineType = 'applied' | 'status' | 'automation' | 'note' | 'decision';

export type AtsResult = 'pass' | 'fail';

export interface CandidateAIEvaluation {
  overallScore: number;
  atsScore: number;
  codingScore: number;
  communicationScore: number;
  domainScore: number;
  summary: string;
}

export interface CandidateNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface CandidateTimelineEvent {
  id: string;
  type: CandidateTimelineType;
  label: string;
  detail: string;
  createdAt: string;
}

export interface CandidateLinks {
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
}

export interface CandidateWorkflowSummary {
  id: string;
  workflowId: string;
  batchName: string | null;
  currentStageId: string | null;
  status: string;
  resumeUrl: string;
  appliedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  resumeUrl: string;
  workflowId: string | null;
  batchName: string | null;
  currentJobTitle: string | null;
  currentStageId: string | null;
  latestParseId: string | null;
  latestAtsAttemptId: string | null;
  latestAtsScore: number | null;
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
  links: CandidateLinks;
  workflows: CandidateWorkflowSummary[];
  notes: CandidateNote[];
  timeline: CandidateTimelineEvent[];
  appliedAt: string;
  updatedAt: string;
}

export interface CandidateRow {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone_number: string | null;
  resume_url: string;
  workflow_id: string | null;
  batch_name: string | null;
  current_job_title: string | null;
  current_stage_id: string | null;
  latest_parse_id: string | null;
  latest_ats_attempt_id: string | null;
  latest_ats_score: number | null;
  experience_summary: string;
  profile_keywords: string[];
  status: CandidateStatus;
  ai_evaluation: CandidateAIEvaluation;
  final_decision: string | null;
  parsed_resume: Record<string, unknown> | null;
  applied_at: Date;
  updated_at: Date;
}

export interface ApplyParsedResumeInput {
  name?: string;
  email?: string;
  phoneNumber?: string | null;
  experienceSummary?: string;
  profileKeywords?: string[];
  currentJobTitle?: string | null;
  latestParseId?: string | null;
  resumeUrl?: string | null;
  workflowId?: string | null;
  batchName?: string | null;
  currentStageId?: string | null;
  parsedResume: Record<string, unknown>;
}

export interface CandidateNoteRow {
  id: string;
  candidate_id: string;
  text: string;
  author: string;
  created_at: Date;
}

export interface CandidateTimelineRow {
  id: string;
  candidate_id: string;
  type: CandidateTimelineType;
  label: string;
  detail: string;
  created_at: Date;
}

export interface CandidateListFilters {
  page: number;
  pageSize: number;
  search?: string;
  status?: CandidateStatus;
  atsResult?: AtsResult;
  sortBy: 'appliedAt' | 'updatedAt' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface CandidateListQueryOptions {
  companyId: string;
  page: number;
  pageSize: number;
  search?: string;
  status?: CandidateStatus;
  minAtsScore?: number;
  maxAtsScore?: number;
  sortColumn: 'applied_at' | 'updated_at' | 'name' | 'status';
  sortOrder: 'ASC' | 'DESC';
}

export interface CandidateInsertInput {
  companyId: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  resumeUrl: string;
  workflowId: string | null;
  batchName?: string | null;
  currentStageId?: string | null;
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
}
