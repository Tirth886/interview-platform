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

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  resumeUrl: string;
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
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
  experience_summary: string;
  profile_keywords: string[];
  status: CandidateStatus;
  ai_evaluation: CandidateAIEvaluation;
  final_decision: string | null;
  applied_at: Date;
  updated_at: Date;
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
  experienceSummary: string;
  profileKeywords: string[];
  status: CandidateStatus;
  aiEvaluation: CandidateAIEvaluation;
  finalDecision: string | null;
}
