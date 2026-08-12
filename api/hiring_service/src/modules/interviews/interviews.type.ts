export type InterviewRoundType = 'ai-interview' | 'coding';

export type InterviewStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

import type { CandidateStatus } from '../../types/common';

export interface Interview {
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
}

export interface InterviewCandidateSummary {
  id: string;
  name: string;
  email: string;
  status: CandidateStatus;
}

export interface InterviewRow {
  id: string;
  company_id: string;
  candidate_id: string;
  round_type: InterviewRoundType;
  status: InterviewStatus;
  start_at: Date;
  duration_minutes: number;
  instructions: string;
  interview_link: string;
  ai_result: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InterviewWithCandidateRow extends InterviewRow {
  candidate_name: string;
  candidate_email: string;
}

export interface InterviewCandidateRow {
  id: string;
  company_id: string;
  name: string;
  email: string;
  status: CandidateStatus;
}

export interface InterviewListFilters {
  from?: string;
  to?: string;
  candidateId?: string;
  status?: InterviewStatus;
  roundType?: InterviewRoundType;
}

export interface InterviewListOptions {
  companyId: string;
  from?: string;
  to?: string;
  candidateId?: string;
  status?: InterviewStatus;
  roundType?: InterviewRoundType;
}

export interface CreateInterviewData {
  companyId: string;
  candidateId: string;
  roundType: InterviewRoundType;
  status: InterviewStatus;
  startAt: string;
  durationMinutes: number;
  instructions: string;
  interviewLink: string;
}
