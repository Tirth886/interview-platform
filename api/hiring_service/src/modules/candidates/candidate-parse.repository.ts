import { PoolClient } from 'pg';
import { db } from '../../providers/database';

export type ResumeParseInsertInput = {
  companyId: string;
  candidateId: string;
  workflowId?: string | null;
  resumeKey?: string | null;
  resumeUrl?: string | null;
  fileName?: string | null;
  status?: 'pending' | 'completed' | 'failed';
  errorMessage?: string | null;
  personalInformation: Record<string, unknown>;
  professionalSummary?: string | null;
  totalExperience?: string | null;
  skills: Record<string, unknown>;
  experience: unknown[];
  education: unknown[];
  projects: unknown[];
  certifications: unknown[];
  languages: unknown[];
  achievements: unknown[];
  internships: unknown[];
  meta: Record<string, unknown>;
  rawPayload: Record<string, unknown>;
};

export type ResumeParseRow = {
  id: string;
  company_id: string;
  candidate_id: string;
  workflow_id: string | null;
  resume_key: string | null;
  resume_url: string | null;
  file_name: string | null;
  status: string;
  personal_information: Record<string, unknown>;
  professional_summary: string | null;
  total_experience: string | null;
  skills: Record<string, unknown>;
  experience: unknown[];
  education: unknown[];
  projects: unknown[];
  certifications: unknown[];
  languages: unknown[];
  achievements: unknown[];
  internships: unknown[];
  meta: Record<string, unknown>;
  created_at: Date;
};

export type CandidateWorkflowUpsertInput = {
  companyId: string;
  candidateId: string;
  workflowId: string;
  batchName?: string | null;
  currentStageId?: string | null;
  status?: string;
  resumeUrl?: string;
  latestParseId?: string | null;
};

export type CandidateWorkflowRow = {
  id: string;
  company_id: string;
  candidate_id: string;
  workflow_id: string;
  batch_name: string | null;
  current_stage_id: string | null;
  status: string;
  resume_url: string;
  latest_parse_id: string | null;
  applied_at: Date;
  updated_at: Date;
};

export type StageAttemptInsertInput = {
  companyId: string;
  candidateId: string;
  workflowId: string;
  candidateWorkflowId?: string | null;
  workflowStageId?: string | null;
  stageType: string;
  status?: string;
  score?: number | null;
  maxScore?: number;
  result?: Record<string, unknown>;
  resumeParseId?: string | null;
  jdKey?: string | null;
  evaluatedBy?: string | null;
};

export class CandidateParseRepository {
  async createResumeParse(
    input: ResumeParseInsertInput,
    client?: PoolClient
  ): Promise<ResumeParseRow> {
    const result = await (client ?? db).query<ResumeParseRow>(
      `INSERT INTO candidate_resume_parses (
        company_id, candidate_id, workflow_id, resume_key, resume_url, file_name,
        status, error_message, personal_information, professional_summary, total_experience,
        skills, experience, education, projects, certifications, languages, achievements,
        internships, meta, raw_payload
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9::jsonb,$10,$11,
        $12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18::jsonb,
        $19::jsonb,$20::jsonb,$21::jsonb
      ) RETURNING *`,
      [
        input.companyId,
        input.candidateId,
        input.workflowId ?? null,
        input.resumeKey ?? null,
        input.resumeUrl ?? null,
        input.fileName ?? null,
        input.status ?? 'completed',
        input.errorMessage ?? null,
        JSON.stringify(input.personalInformation),
        input.professionalSummary ?? null,
        input.totalExperience ?? null,
        JSON.stringify(input.skills),
        JSON.stringify(input.experience),
        JSON.stringify(input.education),
        JSON.stringify(input.projects),
        JSON.stringify(input.certifications),
        JSON.stringify(input.languages),
        JSON.stringify(input.achievements),
        JSON.stringify(input.internships),
        JSON.stringify(input.meta),
        JSON.stringify(input.rawPayload),
      ]
    );
    return result.rows[0];
  }

  async getLatestResumeParse(
    candidateId: string,
    client?: PoolClient
  ): Promise<ResumeParseRow | null> {
    const result = await (client ?? db).query<ResumeParseRow>(
      `SELECT * FROM candidate_resume_parses
       WHERE candidate_id = $1 AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 1`,
      [candidateId]
    );
    return result.rows[0] ?? null;
  }

  async upsertCandidateWorkflow(
    input: CandidateWorkflowUpsertInput,
    client?: PoolClient
  ): Promise<CandidateWorkflowRow> {
    const result = await (client ?? db).query<CandidateWorkflowRow>(
      `INSERT INTO candidate_workflows (
        company_id, candidate_id, workflow_id, batch_name, current_stage_id,
        status, resume_url, latest_parse_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (candidate_id, workflow_id) DO UPDATE SET
        batch_name = COALESCE(EXCLUDED.batch_name, candidate_workflows.batch_name),
        current_stage_id = COALESCE(EXCLUDED.current_stage_id, candidate_workflows.current_stage_id),
        status = COALESCE(EXCLUDED.status, candidate_workflows.status),
        resume_url = CASE
          WHEN EXCLUDED.resume_url IS NOT NULL AND EXCLUDED.resume_url <> '' THEN EXCLUDED.resume_url
          ELSE candidate_workflows.resume_url
        END,
        latest_parse_id = COALESCE(EXCLUDED.latest_parse_id, candidate_workflows.latest_parse_id),
        updated_at = NOW()
      RETURNING *`,
      [
        input.companyId,
        input.candidateId,
        input.workflowId,
        input.batchName ?? null,
        input.currentStageId ?? null,
        input.status ?? 'pending',
        input.resumeUrl ?? '',
        input.latestParseId ?? null,
      ]
    );
    return result.rows[0];
  }

  async findCandidateWorkflow(
    candidateId: string,
    workflowId: string,
    client?: PoolClient
  ): Promise<CandidateWorkflowRow | null> {
    const result = await (client ?? db).query<CandidateWorkflowRow>(
      `SELECT * FROM candidate_workflows
       WHERE candidate_id = $1 AND workflow_id = $2
       LIMIT 1`,
      [candidateId, workflowId]
    );
    return result.rows[0] ?? null;
  }

  async listCandidateWorkflows(
    candidateId: string,
    client?: PoolClient
  ): Promise<CandidateWorkflowRow[]> {
    const result = await (client ?? db).query<CandidateWorkflowRow>(
      `SELECT * FROM candidate_workflows
       WHERE candidate_id = $1
       ORDER BY applied_at DESC`,
      [candidateId]
    );
    return result.rows;
  }

  async createStageAttempt(
    input: StageAttemptInsertInput,
    client?: PoolClient
  ): Promise<{ id: string }> {
    const result = await (client ?? db).query<{ id: string }>(
      `INSERT INTO candidate_stage_attempts (
        company_id, candidate_id, workflow_id, candidate_workflow_id, workflow_stage_id,
        stage_type, status, score, max_score, result, resume_parse_id, jd_key,
        started_at, evaluated_by
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10::jsonb,$11,$12,
        NOW(),$13
      ) RETURNING id`,
      [
        input.companyId,
        input.candidateId,
        input.workflowId,
        input.candidateWorkflowId ?? null,
        input.workflowStageId ?? null,
        input.stageType,
        input.status ?? 'pending',
        input.score ?? null,
        input.maxScore ?? 100,
        JSON.stringify(input.result ?? {}),
        input.resumeParseId ?? null,
        input.jdKey ?? null,
        input.evaluatedBy ?? 'system',
      ]
    );
    return result.rows[0];
  }

  async upsertMetadata(
    companyId: string,
    candidateId: string,
    metaKey: string,
    metaValue: string | null,
    source: string,
    parseId?: string | null,
    client?: PoolClient
  ): Promise<void> {
    await (client ?? db).query(
      `INSERT INTO candidate_metadata (
        company_id, candidate_id, meta_key, meta_value, value_type, source, parse_id
      ) VALUES ($1,$2,$3,$4,'string',$5,$6)
      ON CONFLICT (candidate_id, meta_key) DO UPDATE SET
        meta_value = EXCLUDED.meta_value,
        source = EXCLUDED.source,
        parse_id = COALESCE(EXCLUDED.parse_id, candidate_metadata.parse_id),
        updated_at = NOW()`,
      [companyId, candidateId, metaKey, metaValue, source, parseId ?? null]
    );
  }
}

export const candidateParseRepository = new CandidateParseRepository();
