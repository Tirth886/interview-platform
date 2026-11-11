export type ScheduleInviteStatus = 'pending' | 'scheduled' | 'expired' | 'cancelled';

export type ScheduleRoundType = 'ai-interview' | 'coding' | 'human-interview' | 'qa-evaluation';

export type ScheduleInviteRow = {
  id: string;
  token: string;
  company_id: string;
  candidate_id: string;
  workflow_id: string;
  workflow_node_id: string | null;
  stage_label: string;
  stage_description: string;
  round_type: ScheduleRoundType;
  duration_minutes: number;
  status: ScheduleInviteStatus;
  expires_at: Date;
  scheduled_start_at: Date | null;
  interview_id: string | null;
  emailed_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type ScheduleInviteWithCandidateRow = ScheduleInviteRow & {
  candidate_name: string;
  candidate_email: string;
  company_name: string;
};

export type CreateScheduleInviteData = {
  companyId: string;
  candidateId: string;
  workflowId: string;
  workflowNodeId: string | null;
  stageLabel: string;
  stageDescription: string;
  roundType: ScheduleRoundType;
  durationMinutes: number;
  expiresAt: Date;
};
