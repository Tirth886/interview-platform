import { PoolClient } from 'pg';
import { db } from '../../providers/database';
import {
  CreateScheduleInviteData,
  ScheduleInviteRow,
  ScheduleInviteStatus,
  ScheduleInviteWithCandidateRow,
} from './schedule-invites.type';

export class ScheduleInvitesRepository {
  async createInvite(
    data: CreateScheduleInviteData,
    client?: PoolClient
  ): Promise<ScheduleInviteRow> {
    const result = await (client ?? db).query<ScheduleInviteRow>(
      `INSERT INTO interview_schedule_invites (
         company_id, candidate_id, workflow_id, workflow_node_id,
         stage_label, stage_description, round_type, duration_minutes, expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.companyId,
        data.candidateId,
        data.workflowId,
        data.workflowNodeId,
        data.stageLabel,
        data.stageDescription,
        data.roundType,
        data.durationMinutes,
        data.expiresAt.toISOString(),
      ]
    );
    return result.rows[0];
  }

  async findByToken(token: string, client?: PoolClient): Promise<ScheduleInviteWithCandidateRow | null> {
    const result = await (client ?? db).query<ScheduleInviteWithCandidateRow>(
      `SELECT i.*,
              c.name AS candidate_name,
              c.email AS candidate_email,
              co.name AS company_name
       FROM interview_schedule_invites i
       INNER JOIN candidates c ON c.id = i.candidate_id
       INNER JOIN companies co ON co.id = i.company_id
       WHERE i.token = $1
       LIMIT 1`,
      [token]
    );
    return result.rows[0] ?? null;
  }

  async findPendingByCandidateStage(
    companyId: string,
    candidateId: string,
    workflowNodeId: string,
    client?: PoolClient
  ): Promise<ScheduleInviteRow | null> {
    const result = await (client ?? db).query<ScheduleInviteRow>(
      `SELECT *
       FROM interview_schedule_invites
       WHERE company_id = $1
         AND candidate_id = $2
         AND workflow_node_id = $3
         AND status = 'pending'
         AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [companyId, candidateId, workflowNodeId]
    );
    return result.rows[0] ?? null;
  }

  async markEmailed(inviteId: string, client?: PoolClient): Promise<void> {
    await (client ?? db).query(
      `UPDATE interview_schedule_invites
       SET emailed_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [inviteId]
    );
  }

  async markScheduled(
    inviteId: string,
    startAt: string,
    interviewId: string,
    client?: PoolClient
  ): Promise<ScheduleInviteRow | null> {
    const result = await (client ?? db).query<ScheduleInviteRow>(
      `UPDATE interview_schedule_invites
       SET status = 'scheduled',
           scheduled_start_at = $2::timestamptz,
           interview_id = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [inviteId, startAt, interviewId]
    );
    return result.rows[0] ?? null;
  }

  async updateStatus(
    inviteId: string,
    status: ScheduleInviteStatus,
    client?: PoolClient
  ): Promise<void> {
    await (client ?? db).query(
      `UPDATE interview_schedule_invites
       SET status = $2, updated_at = NOW()
       WHERE id = $1`,
      [inviteId, status]
    );
  }

  async cancelPendingForCandidateStage(
    companyId: string,
    candidateId: string,
    workflowNodeId: string,
    client?: PoolClient
  ): Promise<void> {
    await (client ?? db).query(
      `UPDATE interview_schedule_invites
       SET status = 'cancelled', updated_at = NOW()
       WHERE company_id = $1
         AND candidate_id = $2
         AND workflow_node_id = $3
         AND status = 'pending'`,
      [companyId, candidateId, workflowNodeId]
    );
  }

  async findByInterviewId(
    interviewId: string,
    client?: PoolClient
  ): Promise<ScheduleInviteRow | null> {
    const result = await (client ?? db).query<ScheduleInviteRow>(
      `SELECT *
       FROM interview_schedule_invites
       WHERE interview_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [interviewId]
    );
    return result.rows[0] ?? null;
  }
}

export const scheduleInvitesRepository = new ScheduleInvitesRepository();
