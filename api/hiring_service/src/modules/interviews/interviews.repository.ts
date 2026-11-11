import { PoolClient } from 'pg';
import { db } from '../../providers/database';
import {
  CreateInterviewData,
  InterviewCandidateRow,
  InterviewListOptions,
  InterviewRow,
  InterviewStatus,
  InterviewWithCandidateRow,
} from './interviews.type';

export class InterviewsRepository {
  async listInterviews(options: InterviewListOptions): Promise<InterviewRow[]> {
    const where: string[] = ['company_id = $1'];
    const params: unknown[] = [options.companyId];

    if (options.from) {
      params.push(options.from);
      where.push(`start_at >= $${params.length}::timestamptz`);
    }

    if (options.to) {
      params.push(options.to);
      where.push(`start_at <= $${params.length}::timestamptz`);
    }

    if (options.candidateId) {
      params.push(options.candidateId);
      where.push(`candidate_id = $${params.length}`);
    }

    if (options.status) {
      params.push(options.status);
      where.push(`status = $${params.length}`);
    }

    if (options.roundType) {
      params.push(options.roundType);
      where.push(`round_type = $${params.length}`);
    }

    const result = await db.query<InterviewRow>(
      `SELECT *
       FROM interviews
       WHERE ${where.join(' AND ')}
       ORDER BY start_at ASC`,
      params
    );

    return result.rows;
  }

  async findInterviewById(
    companyId: string,
    interviewId: string,
    client?: PoolClient
  ): Promise<InterviewRow | null> {
    const result = await (client ?? db).query<InterviewRow>(
      'SELECT * FROM interviews WHERE company_id = $1 AND id = $2 LIMIT 1',
      [companyId, interviewId]
    );

    return result.rows[0] ?? null;
  }

  async findInterviewBySessionToken(
    sessionToken: string
  ): Promise<InterviewWithCandidateRow | null> {
    const result = await db.query<InterviewWithCandidateRow>(
      `SELECT i.*, c.name AS candidate_name, c.email AS candidate_email
       FROM interviews i
       INNER JOIN candidates c ON i.candidate_id = c.id
       WHERE i.interview_link LIKE '%' || $1 || '%'
       LIMIT 1`,
      [sessionToken]
    );

    return result.rows[0] ?? null;
  }

  async createInterview(data: CreateInterviewData, client?: PoolClient): Promise<InterviewRow> {
    const result = await (client ?? db).query<InterviewRow>(
      `INSERT INTO interviews (
         company_id,
         candidate_id,
         round_type,
         status,
         start_at,
         duration_minutes,
         instructions,
         interview_link,
         qa_bank_id,
         ai_result
       )
       VALUES ($1, $2, $3, $4, $5::timestamptz, $6, $7, $8, $9, NULL)
       RETURNING *`,
      [
        data.companyId,
        data.candidateId,
        data.roundType,
        data.status,
        data.startAt,
        data.durationMinutes,
        data.instructions,
        data.interviewLink,
        data.qaBankId ?? null,
      ]
    );

    return result.rows[0];
  }

  async rescheduleInterview(
    companyId: string,
    interviewId: string,
    startAt: string,
    durationMinutes: number,
    client?: PoolClient
  ): Promise<InterviewRow | null> {
    const result = await (client ?? db).query<InterviewRow>(
      `UPDATE interviews
       SET start_at = $3::timestamptz,
           duration_minutes = $4,
           updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING *`,
      [companyId, interviewId, startAt, durationMinutes]
    );

    return result.rows[0] ?? null;
  }

  async updateInterviewStatus(
    companyId: string,
    interviewId: string,
    status: InterviewStatus,
    aiResult: string | null,
    client?: PoolClient
  ): Promise<InterviewRow | null> {
    const result = await (client ?? db).query<InterviewRow>(
      `UPDATE interviews
       SET status = $3,
           ai_result = $4,
           updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING *`,
      [companyId, interviewId, status, aiResult]
    );

    return result.rows[0] ?? null;
  }

  async updateInterviewStatusBySessionToken(
    sessionToken: string,
    status: InterviewStatus,
    aiResult: string | null,
    client?: PoolClient
  ): Promise<InterviewRow | null> {
    const result = await (client ?? db).query<InterviewRow>(
      `UPDATE interviews
       SET status = $2,
           ai_result = $3,
           updated_at = NOW()
       WHERE interview_link LIKE '%' || $1 || '%'
       RETURNING *`,
      [sessionToken, status, aiResult]
    );

    return result.rows[0] ?? null;
  }

  async findCandidateById(
    companyId: string,
    candidateId: string,
    client?: PoolClient
  ): Promise<InterviewCandidateRow | null> {
    const result = await (client ?? db).query<InterviewCandidateRow>(
      `SELECT id, company_id, name, email, status
       FROM candidates
       WHERE company_id = $1 AND id = $2
       LIMIT 1`,
      [companyId, candidateId]
    );

    return result.rows[0] ?? null;
  }

  async promoteCandidateToActiveIfPending(
    companyId: string,
    candidateId: string,
    client?: PoolClient
  ): Promise<void> {
    await (client ?? db).query(
      `UPDATE candidates
       SET status = 'active',
           updated_at = NOW()
       WHERE company_id = $1 AND id = $2 AND status = 'pending'`,
      [companyId, candidateId]
    );
  }

  async addCandidateTimelineEvent(
    candidateId: string,
    label: string,
    detail: string,
    client?: PoolClient
  ): Promise<void> {
    await (client ?? db).query(
      `INSERT INTO candidate_timeline (candidate_id, type, label, detail)
       VALUES ($1, 'status', $2, $3)`,
      [candidateId, label, detail]
    );
  }

  async listInterviewsByEmail(email: string): Promise<InterviewRow[]> {
    const result = await db.query<InterviewRow>(
      `SELECT i.*
       FROM interviews i
       INNER JOIN candidates c ON i.candidate_id = c.id
       WHERE LOWER(c.email) = LOWER($1)
       ORDER BY i.start_at ASC`,
      [email]
    );

    return result.rows;
  }
}

export const interviewsRepository = new InterviewsRepository();
