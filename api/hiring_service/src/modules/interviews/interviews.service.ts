import crypto from 'crypto';
import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import {
  CreateInterviewInput,
  ListInterviewsQueryInput,
  RescheduleInterviewInput,
  UpdateInterviewStatusInput,
} from './interviews.schema';
import { InterviewsRepository, interviewsRepository } from './interviews.repository';
import {
  Interview,
  InterviewCandidateSummary,
  InterviewListFilters,
  InterviewRow,
  InterviewWithCandidateRow,
} from './interviews.type';

export class InterviewsService {
  constructor(private readonly interviewsRepository: InterviewsRepository) {}

  private mapInterview(row: InterviewRow): Interview {
    return {
      id: row.id,
      candidateId: row.candidate_id,
      roundType: row.round_type,
      status: row.status,
      startAt: row.start_at.toISOString(),
      durationMinutes: row.duration_minutes,
      instructions: row.instructions,
      interviewLink: row.interview_link,
      aiResult: row.ai_result,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async listInterviews(
    companyId: string,
    query: ListInterviewsQueryInput
  ): Promise<{ items: Interview[] }> {
    const filters: InterviewListFilters = {
      from: query.from,
      to: query.to,
      candidateId: query.candidateId,
      status: query.status,
      roundType: query.roundType,
    };

    const rows = await this.interviewsRepository.listInterviews({
      companyId,
      from: filters.from,
      to: filters.to,
      candidateId: filters.candidateId,
      status: filters.status,
      roundType: filters.roundType,
    });

    return {
      items: rows.map((row) => this.mapInterview(row)),
    };
  }

  private mapInterviewSession(row: InterviewWithCandidateRow) {
    const scheduledAt = row.start_at.toISOString();
    const expiresAt = new Date(row.start_at.getTime() + row.duration_minutes * 60000).toISOString();

    return {
      id: row.interview_link.split('/session/').pop()?.split('?')[0] ?? row.id,
      title: `${row.candidate_name} • ${row.round_type === 'ai-interview' ? 'AI Interview' : 'Coding Interview'}`,
      jobTitle: 'Interview Session',
      candidateName: row.candidate_name,
      candidateEmail: row.candidate_email,
      aiInterviewerName: row.round_type === 'ai-interview' ? 'Aria' : 'Interviewer',
      scheduledAt,
      expiresAt,
      durationMinutes: row.duration_minutes,
      instructions: row.instructions,
      status: row.status,
    };
  }

  async scheduleInterview(
    companyId: string,
    payload: CreateInterviewInput
  ): Promise<{ interview: Interview }> {
    const interview = await withTransaction(async (client) => {
      const candidate = await this.interviewsRepository.findCandidateById(
        companyId,
        payload.candidateId,
        client
      );

      if (!candidate) {
        throw new NotFoundError('Candidate not found');
      }

      const sessionToken = crypto.randomUUID();
      const sessionPath = `/session/${sessionToken}`;
      const created = await this.interviewsRepository.createInterview(
        {
          companyId,
          candidateId: payload.candidateId,
          roundType: payload.roundType,
          status: 'scheduled',
          startAt: payload.startAt,
          durationMinutes: payload.durationMinutes,
          instructions: payload.instructions,
          interviewLink: sessionPath,
        },
        client
      );

      await this.interviewsRepository.promoteCandidateToActiveIfPending(
        companyId,
        payload.candidateId,
        client
      );

      await this.interviewsRepository.addCandidateTimelineEvent(
        payload.candidateId,
        'Interview scheduled',
        `Interview ${payload.roundType} scheduled at ${new Date(payload.startAt).toISOString()} for ${payload.durationMinutes} minutes.`,
        client
      );

      return created;
    });

    return {
      interview: this.mapInterview(interview),
    };
  }

  async rescheduleInterview(
    companyId: string,
    interviewId: string,
    payload: RescheduleInterviewInput
  ): Promise<{ interview: Interview }> {
    const updated = await withTransaction(async (client) => {
      const existing = await this.interviewsRepository.findInterviewById(
        companyId,
        interviewId,
        client
      );
      if (!existing) {
        throw new NotFoundError('Interview not found');
      }

      if (existing.status === 'completed' || existing.status === 'cancelled') {
        throw new ValidationError('Cannot reschedule a completed or cancelled interview');
      }

      const next = await this.interviewsRepository.rescheduleInterview(
        companyId,
        interviewId,
        payload.startAt,
        payload.durationMinutes,
        client
      );

      if (!next) {
        throw new NotFoundError('Interview not found');
      }

      await this.interviewsRepository.addCandidateTimelineEvent(
        existing.candidate_id,
        'Interview rescheduled',
        `Interview moved to ${new Date(payload.startAt).toISOString()} for ${payload.durationMinutes} minutes.`,
        client
      );

      return next;
    });

    return {
      interview: this.mapInterview(updated),
    };
  }

  async cancelInterview(companyId: string, interviewId: string): Promise<{ interview: Interview }> {
    const updated = await withTransaction(async (client) => {
      const existing = await this.interviewsRepository.findInterviewById(
        companyId,
        interviewId,
        client
      );
      if (!existing) {
        throw new NotFoundError('Interview not found');
      }

      const next = await this.interviewsRepository.updateInterviewStatus(
        companyId,
        interviewId,
        'cancelled',
        existing.ai_result,
        client
      );

      if (!next) {
        throw new NotFoundError('Interview not found');
      }

      await this.interviewsRepository.addCandidateTimelineEvent(
        existing.candidate_id,
        'Interview cancelled',
        'Scheduled interview was cancelled.',
        client
      );

      return next;
    });

    return {
      interview: this.mapInterview(updated),
    };
  }

  async updateInterviewStatus(
    companyId: string,
    interviewId: string,
    payload: UpdateInterviewStatusInput
  ): Promise<{ interview: Interview }> {
    const updated = await withTransaction(async (client) => {
      const existing = await this.interviewsRepository.findInterviewById(
        companyId,
        interviewId,
        client
      );
      if (!existing) {
        throw new NotFoundError('Interview not found');
      }

      const aiResult =
        payload.status === 'completed' ? (payload.aiResult ?? existing.ai_result) : null;
      const next = await this.interviewsRepository.updateInterviewStatus(
        companyId,
        interviewId,
        payload.status,
        aiResult,
        client
      );

      if (!next) {
        throw new NotFoundError('Interview not found');
      }

      await this.interviewsRepository.addCandidateTimelineEvent(
        existing.candidate_id,
        'Interview status updated',
        `Interview status changed to ${payload.status}.`,
        client
      );

      return next;
    });

    return {
      interview: this.mapInterview(updated),
    };
  }

  async getInterviewById(
    companyId: string,
    interviewId: string
  ): Promise<{ interview: Interview; candidate: InterviewCandidateSummary }> {
    const interview = await this.interviewsRepository.findInterviewById(companyId, interviewId);
    if (!interview) {
      throw new NotFoundError('Interview not found');
    }

    const candidate = await this.interviewsRepository.findCandidateById(
      companyId,
      interview.candidate_id
    );
    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    return {
      interview: this.mapInterview(interview),
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
      },
    };
  }

  async listInterviewsByEmail(email: string): Promise<{ items: Interview[] }> {
    const rows = await this.interviewsRepository.listInterviewsByEmail(email);
    return {
      items: rows.map((row) => this.mapInterview(row)),
    };
  }

  async validateInterviewSession(
    sessionId: string,
    role: string,
    user?: string
  ): Promise<{ session: Record<string, unknown>; role: 'candidate'; user: string }> {
    if (role !== 'candidate') {
      throw new ValidationError('Only candidates may access the interview portal.');
    }

    const interview = await this.interviewsRepository.findInterviewBySessionToken(sessionId);
    if (!interview) {
      throw new NotFoundError('Interview session not found.');
    }

    const now = Date.now();
    const expiresAt = new Date(
      interview.start_at.getTime() + interview.duration_minutes * 60000
    ).getTime();

    if (now > expiresAt) {
      throw new ValidationError('This interview session link has expired.');
    }

    if (user) {
      if (interview.candidate_email.toLowerCase() !== user.toLowerCase()) {
        throw new ValidationError('The provided user does not match the interview candidate.');
      }
    }

    return {
      session: this.mapInterviewSession(interview),
      role: 'candidate',
      user: interview.candidate_email,
    };
  }

  async joinInterviewSession(
    sessionId: string,
    role: string,
    user?: string
  ): Promise<{ session: Record<string, unknown>; role: 'candidate'; user: string }> {
    if (role !== 'candidate') {
      throw new ValidationError('Only candidates may join the interview portal.');
    }

    const interview = await this.interviewsRepository.findInterviewBySessionToken(sessionId);
    if (!interview) {
      throw new NotFoundError('Interview session not found.');
    }

    const now = Date.now();
    const expiresAt = new Date(
      interview.start_at.getTime() + interview.duration_minutes * 60000
    ).getTime();

    if (now > expiresAt) {
      throw new ValidationError('This interview session link has expired.');
    }

    if (interview.status === 'cancelled' || interview.status === 'completed') {
      throw new ValidationError('This interview session is no longer available.');
    }

    const updatedInterview = await withTransaction(async (client) => {
      if (interview.status === 'scheduled') {
        const next = await this.interviewsRepository.updateInterviewStatusBySessionToken(
          sessionId,
          'in-progress',
          null,
          client
        );

        if (!next) {
          throw new NotFoundError('Interview session not found.');
        }

        await this.interviewsRepository.addCandidateTimelineEvent(
          interview.candidate_id,
          'candidate_interview_wise',
          'Candidate started the active interview session.',
          client
        );

        return next;
      }

      await this.interviewsRepository.addCandidateTimelineEvent(
        interview.candidate_id,
        'candidate_interview_wise',
        'Candidate reopened a running interview session.',
        client
      );

      return interview;
    });

    return {
      session: this.mapInterviewSession({
        ...updatedInterview,
        candidate_name: interview.candidate_name,
        candidate_email: interview.candidate_email,
      }),
      role: 'candidate',
      user: user ?? '',
    };
  }
}

export const interviewsService = new InterviewsService(interviewsRepository);
