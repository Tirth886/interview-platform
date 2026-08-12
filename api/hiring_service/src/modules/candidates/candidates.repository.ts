import { PoolClient } from 'pg';
import { db } from '../../providers/database';
import {
  CandidateInsertInput,
  CandidateListQueryOptions,
  CandidateNoteRow,
  CandidateRow,
  CandidateStatus,
  CandidateTimelineRow,
  CandidateTimelineType,
} from './candidates.type';

export class CandidatesRepository {
  async listCandidates(
    options: CandidateListQueryOptions
  ): Promise<{ rows: CandidateRow[]; total: number }> {
    const where: string[] = ['company_id = $1'];
    const params: unknown[] = [options.companyId];

    if (options.search) {
      params.push(`%${options.search.toLowerCase()}%`);
      where.push(
        `(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(phone_number, '')) LIKE $${params.length})`
      );
    }

    if (options.status) {
      params.push(options.status);
      where.push(`status = $${params.length}`);
    }

    if (options.minAtsScore !== undefined) {
      params.push(options.minAtsScore);
      where.push(`COALESCE((ai_evaluation->>'atsScore')::int, 0) >= $${params.length}`);
    }

    if (options.maxAtsScore !== undefined) {
      params.push(options.maxAtsScore);
      where.push(`COALESCE((ai_evaluation->>'atsScore')::int, 0) <= $${params.length}`);
    }

    const whereClause = where.join(' AND ');

    const countResult = await db.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM candidates WHERE ${whereClause}`,
      params
    );

    params.push(options.pageSize);
    params.push((options.page - 1) * options.pageSize);

    const rowsResult = await db.query<CandidateRow>(
      `SELECT *
       FROM candidates
       WHERE ${whereClause}
       ORDER BY ${options.sortColumn} ${options.sortOrder}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async findCandidateById(
    companyId: string,
    candidateId: string,
    client?: PoolClient
  ): Promise<CandidateRow | null> {
    const result = await (client ?? db).query<CandidateRow>(
      'SELECT * FROM candidates WHERE company_id = $1 AND id = $2 LIMIT 1',
      [companyId, candidateId]
    );
    return result.rows[0] ?? null;
  }

  async getNotesByCandidateIds(candidateIds: string[]): Promise<CandidateNoteRow[]> {
    if (candidateIds.length === 0) return [];

    const result = await db.query<CandidateNoteRow>(
      `SELECT *
       FROM candidate_notes
       WHERE candidate_id = ANY($1::uuid[])
       ORDER BY created_at DESC`,
      [candidateIds]
    );

    return result.rows;
  }

  async getTimelineByCandidateIds(candidateIds: string[]): Promise<CandidateTimelineRow[]> {
    if (candidateIds.length === 0) return [];

    const result = await db.query<CandidateTimelineRow>(
      `SELECT *
       FROM candidate_timeline
       WHERE candidate_id = ANY($1::uuid[])
       ORDER BY created_at DESC`,
      [candidateIds]
    );

    return result.rows;
  }

  async updateCandidateStatus(
    companyId: string,
    candidateId: string,
    status: CandidateStatus,
    finalDecision: string | null,
    client?: PoolClient
  ): Promise<CandidateRow | null> {
    const result = await (client ?? db).query<CandidateRow>(
      `UPDATE candidates
       SET status = $3,
           final_decision = $4,
           updated_at = NOW()
       WHERE company_id = $1 AND id = $2
       RETURNING *`,
      [companyId, candidateId, status, finalDecision]
    );

    return result.rows[0] ?? null;
  }

  async addCandidateNote(
    candidateId: string,
    text: string,
    author: string,
    client?: PoolClient
  ): Promise<CandidateNoteRow> {
    const result = await (client ?? db).query<CandidateNoteRow>(
      `INSERT INTO candidate_notes (candidate_id, text, author)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [candidateId, text, author]
    );

    return result.rows[0];
  }

  async addTimelineEvent(
    candidateId: string,
    type: CandidateTimelineType,
    label: string,
    detail: string,
    client?: PoolClient
  ): Promise<CandidateTimelineRow> {
    const result = await (client ?? db).query<CandidateTimelineRow>(
      `INSERT INTO candidate_timeline (candidate_id, type, label, detail)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [candidateId, type, label, detail]
    );

    return result.rows[0];
  }

  async createCandidate(input: CandidateInsertInput, client?: PoolClient): Promise<CandidateRow> {
    const result = await (client ?? db).query<CandidateRow>(
      `INSERT INTO candidates (
        company_id,
        name,
        email,
        phone_number,
        resume_url,
        experience_summary,
        profile_keywords,
        status,
        ai_evaluation,
        final_decision
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
      RETURNING *`,
      [
        input.companyId,
        input.name,
        input.email,
        input.phoneNumber,
        input.resumeUrl,
        input.experienceSummary,
        input.profileKeywords,
        input.status,
        JSON.stringify(input.aiEvaluation),
        input.finalDecision,
      ]
    );

    return result.rows[0];
  }
}

export const candidatesRepository = new CandidatesRepository();
