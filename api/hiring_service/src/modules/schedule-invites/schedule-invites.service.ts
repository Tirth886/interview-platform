import crypto from 'crypto';
import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { env } from '../../config/env';
import { withTransaction } from '../../providers/database';
import { sendMail } from '../../providers/mailer';
import { candidatesRepository } from '../candidates/candidates.repository';
import { interviewsRepository } from '../interviews/interviews.repository';
import { WorkflowNodeRow, workflowsRepository } from '../workflows/workflows.repository';
import { CreateScheduleInviteInput } from './schedule-invites.schema';
import { scheduleInvitesRepository } from './schedule-invites.repository';
import { ScheduleRoundType } from './schedule-invites.type';

const INVITE_TTL_DAYS = 14;
const PLACEHOLDER_EMAIL_RE = /@placeholder\.local$/i;

const isSchedulableNode = (node: WorkflowNodeRow): boolean => {
  if (node.is_delete || !node.is_enabled) return false;
  if (node.kind !== 'stage') return false;
  return node.conductor === 'ai' || node.conductor === 'human' || node.conductor === 'qa';
};

const resolveRoundType = (node: WorkflowNodeRow): ScheduleRoundType => {
  const code = (node.code || '').toLowerCase();
  if (code.includes('coding') || code.includes('dsa')) {
    return 'coding';
  }
  if (node.conductor === 'qa') {
    return 'qa-evaluation';
  }
  if (node.conductor === 'human') {
    return 'human-interview';
  }
  return 'ai-interview';
};

const resolveDuration = (node: WorkflowNodeRow): number => {
  const raw = node.config?.durationMinutes;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 15) {
    return Math.min(360, Math.round(raw));
  }
  return 45;
};

const resolveDescription = (node: WorkflowNodeRow): string => {
  const raw = node.config?.description;
  return typeof raw === 'string' ? raw.trim() : '';
};

const buildScheduleUrl = (token: string): string => {
  const base = env.INTERVIEW_PORTAL_URL.replace(/\/$/, '');
  return `${base}/schedule/${token}`;
};

export class ScheduleInvitesService {
  private pickStageNode(
    nodes: WorkflowNodeRow[],
    preferredNodeId?: string | null,
    currentStageId?: string | null
  ): WorkflowNodeRow {
    const schedulable = nodes
      .filter(isSchedulableNode)
      .slice()
      .sort((a, b) => a.order_index - b.order_index);

    if (schedulable.length === 0) {
      throw new ValidationError(
        'No schedulable stage found on this workflow. Add an AI, Human, or Q&A stage.'
      );
    }

    if (preferredNodeId) {
      const preferred = schedulable.find((node) => node.id === preferredNodeId);
      if (preferred) {
        return preferred;
      }
      // Fall through when the current/selected stage is ATS/Q&A — pick first interview stage
    }

    if (currentStageId) {
      const current = schedulable.find((node) => node.id === currentStageId);
      if (current) return current;
    }

    return schedulable[0];
  }

  private mapPublicInvite(row: {
    token: string;
    stage_label: string;
    stage_description: string;
    round_type: ScheduleRoundType;
    duration_minutes: number;
    status: string;
    expires_at: Date;
    scheduled_start_at: Date | null;
    candidate_name: string;
    candidate_email: string;
    company_name: string;
  }) {
    return {
      token: row.token,
      status: row.status,
      stageLabel: row.stage_label,
      stageDescription: row.stage_description,
      roundType: row.round_type,
      durationMinutes: row.duration_minutes,
      expiresAt: row.expires_at.toISOString(),
      scheduledStartAt: row.scheduled_start_at?.toISOString() ?? null,
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      companyName: row.company_name,
      scheduleUrl: buildScheduleUrl(row.token),
    };
  }

  async getInviteByToken(token: string) {
    const row = await scheduleInvitesRepository.findByToken(token);
    if (!row) {
      throw new NotFoundError('Schedule invite not found');
    }

    if (row.status === 'pending' && row.expires_at.getTime() < Date.now()) {
      await scheduleInvitesRepository.updateStatus(row.id, 'expired');
      throw new ValidationError('This schedule link has expired.');
    }

    if (row.status === 'cancelled' || row.status === 'expired') {
      throw new ValidationError('This schedule link is no longer available.');
    }

    return {
      invite: this.mapPublicInvite(row),
    };
  }

  async createInviteForCandidate(
    companyId: string,
    candidateId: string,
    payload: CreateScheduleInviteInput = {}
  ) {
    const candidate = await candidatesRepository.findCandidateById(companyId, candidateId);
    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    if (!candidate.workflow_id) {
      throw new ValidationError('Candidate has no workflow assigned.');
    }

    if (!candidate.email || PLACEHOLDER_EMAIL_RE.test(candidate.email)) {
      throw new ValidationError(
        'Candidate needs a real email before a schedule invite can be sent. Parse the resume first.'
      );
    }

    const workflow = await workflowsRepository.findById(companyId, candidate.workflow_id);
    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }

    const nodes = await workflowsRepository.listNodes(companyId, workflow.id);
    const stageNode = this.pickStageNode(
      nodes,
      payload.workflowNodeId ?? null,
      candidate.current_stage_id
    );

    if (!payload.resend) {
      const existing = await scheduleInvitesRepository.findPendingByCandidateStage(
        companyId,
        candidateId,
        stageNode.id
      );
      if (existing) {
        const withMeta = await scheduleInvitesRepository.findByToken(existing.token);
        if (withMeta) {
          const mail = await this.sendInviteEmail(withMeta);
          return {
            invite: this.mapPublicInvite(withMeta),
            reused: true,
            email: mail,
          };
        }
      }
    } else {
      await scheduleInvitesRepository.cancelPendingForCandidateStage(
        companyId,
        candidateId,
        stageNode.id
      );
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const created = await withTransaction(async (client) => {
      const invite = await scheduleInvitesRepository.createInvite(
        {
          companyId,
          candidateId,
          workflowId: workflow.id,
          workflowNodeId: stageNode.id,
          stageLabel: stageNode.label,
          stageDescription: resolveDescription(stageNode),
          roundType: resolveRoundType(stageNode),
          durationMinutes: resolveDuration(stageNode),
          expiresAt,
        },
        client
      );

      await candidatesRepository.addTimelineEvent(
        candidateId,
        'automation',
        'Schedule invite created',
        `Invite created for stage "${stageNode.label}".`,
        client
      );

      return invite;
    });

    const withMeta = await scheduleInvitesRepository.findByToken(created.token);
    if (!withMeta) {
      throw new NotFoundError('Schedule invite not found after create');
    }

    const mail = await this.sendInviteEmail(withMeta);

    return {
      invite: this.mapPublicInvite(withMeta),
      reused: false,
      email: mail,
    };
  }

  private async sendInviteEmail(row: {
    id: string;
    token: string;
    stage_label: string;
    stage_description: string;
    duration_minutes: number;
    expires_at: Date;
    candidate_name: string;
    candidate_email: string;
    company_name: string;
  }) {
    const scheduleUrl = buildScheduleUrl(row.token);
    const descriptionBlock = row.stage_description
      ? `\n\nStage details:\n${row.stage_description}\n`
      : '\n';
    const text = [
      `Hi ${row.candidate_name},`,
      '',
      `${row.company_name} invited you to schedule your "${row.stage_label}" stage.`,
      `Duration: ${row.duration_minutes} minutes.`,
      descriptionBlock.trimEnd(),
      '',
      `Pick a date and time here:`,
      scheduleUrl,
      '',
      `This link expires on ${row.expires_at.toUTCString()}.`,
    ].join('\n');

    const html = `
      <p>Hi ${escapeHtml(row.candidate_name)},</p>
      <p><strong>${escapeHtml(row.company_name)}</strong> invited you to schedule your
      <strong>${escapeHtml(row.stage_label)}</strong> stage (${row.duration_minutes} minutes).</p>
      ${
        row.stage_description
          ? `<p>${escapeHtml(row.stage_description).replace(/\n/g, '<br/>')}</p>`
          : ''
      }
      <p><a href="${scheduleUrl}">Choose date and time</a></p>
      <p style="color:#64748b;font-size:12px;">Link expires ${escapeHtml(row.expires_at.toUTCString())}.</p>
    `;

    const result = await sendMail({
      to: row.candidate_email,
      subject: `Schedule your ${row.stage_label} with ${row.company_name}`,
      text,
      html,
    });

    if (result.delivered || result.mode === 'console') {
      await scheduleInvitesRepository.markEmailed(row.id);
    }

    return {
      delivered: result.delivered,
      mode: result.mode,
      to: row.candidate_email,
      scheduleUrl,
    };
  }

  async submitSchedule(token: string, startAt: string) {
    const row = await scheduleInvitesRepository.findByToken(token);
    if (!row) {
      throw new NotFoundError('Schedule invite not found');
    }

    if (row.status === 'scheduled' && row.interview_id) {
      throw new ValidationError('This stage is already scheduled.');
    }

    if (row.status !== 'pending') {
      throw new ValidationError('This schedule link is no longer available.');
    }

    if (row.expires_at.getTime() < Date.now()) {
      await scheduleInvitesRepository.updateStatus(row.id, 'expired');
      throw new ValidationError('This schedule link has expired.');
    }

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      throw new ValidationError('Invalid start time.');
    }
    if (startDate.getTime() < Date.now() - 60_000) {
      throw new ValidationError('Please choose a future date and time.');
    }

    const instructions =
      row.stage_description.trim() ||
      `${row.stage_label} — scheduled by candidate.`;

    let qaBankId: string | null = null;
    if (row.round_type === 'qa-evaluation' && row.workflow_node_id) {
      const nodes = await workflowsRepository.listNodes(row.company_id, row.workflow_id);
      const stageNode = nodes.find((node) => node.id === row.workflow_node_id);
      qaBankId = stageNode?.qa_bank_id ?? null;
      if (!qaBankId) {
        throw new ValidationError(
          'This Q&A stage has no question bank bound. Edit the workflow stage and select a Q&A bank.'
        );
      }
    }

    const interview = await withTransaction(async (client) => {
      const sessionToken = crypto.randomUUID();
      const sessionPath = `/session/${sessionToken}`;

      const created = await interviewsRepository.createInterview(
        {
          companyId: row.company_id,
          candidateId: row.candidate_id,
          roundType: row.round_type,
          status: 'scheduled',
          startAt: startDate.toISOString(),
          durationMinutes: row.duration_minutes,
          instructions,
          interviewLink: sessionPath,
          qaBankId,
        },
        client
      );

      await interviewsRepository.promoteCandidateToActiveIfPending(
        row.company_id,
        row.candidate_id,
        client
      );

      await scheduleInvitesRepository.markScheduled(
        row.id,
        startDate.toISOString(),
        created.id,
        client
      );

      await candidatesRepository.addTimelineEvent(
        row.candidate_id,
        'automation',
        'Interview self-scheduled',
        `Candidate scheduled "${row.stage_label}" for ${startDate.toISOString()}.`,
        client
      );

      await interviewsRepository.addCandidateTimelineEvent(
        row.candidate_id,
        'Interview scheduled',
        `Interview ${row.round_type} scheduled at ${startDate.toISOString()} for ${row.duration_minutes} minutes (candidate booking).`,
        client
      );

      return created;
    });

    const sessionId = interview.interview_link.split('/session/').pop() ?? '';
    const portalBase = env.INTERVIEW_PORTAL_URL.replace(/\/$/, '');
    const sessionUrl = `${portalBase}/session/${sessionId}?role=candidate&user=${encodeURIComponent(row.candidate_email)}`;

    await sendMail({
      to: row.candidate_email,
      subject: `Confirmed: ${row.stage_label} on ${startDate.toUTCString()}`,
      text: [
        `Hi ${row.candidate_name},`,
        '',
        `Your "${row.stage_label}" with ${row.company_name} is confirmed.`,
        `When: ${startDate.toUTCString()}`,
        `Duration: ${row.duration_minutes} minutes`,
        '',
        `Join link (closer to the time):`,
        sessionUrl,
      ].join('\n'),
      html: `
        <p>Hi ${escapeHtml(row.candidate_name)},</p>
        <p>Your <strong>${escapeHtml(row.stage_label)}</strong> with
        <strong>${escapeHtml(row.company_name)}</strong> is confirmed.</p>
        <p><strong>When:</strong> ${escapeHtml(startDate.toUTCString())}<br/>
        <strong>Duration:</strong> ${row.duration_minutes} minutes</p>
        <p><a href="${sessionUrl}">Open interview session</a></p>
      `,
    });

    return {
      invite: {
        token: row.token,
        status: 'scheduled' as const,
        stageLabel: row.stage_label,
        stageDescription: row.stage_description,
        roundType: row.round_type,
        durationMinutes: row.duration_minutes,
        scheduledStartAt: startDate.toISOString(),
        companyName: row.company_name,
        sessionUrl,
      },
      interview: {
        id: interview.id,
        startAt: interview.start_at.toISOString(),
        durationMinutes: interview.duration_minutes,
        interviewLink: interview.interview_link,
        status: interview.status,
        roundType: interview.round_type,
      },
    };
  }
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const scheduleInvitesService = new ScheduleInvitesService();
