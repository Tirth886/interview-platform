import crypto from 'crypto';
import { NotFoundError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import {
  AddCandidateNoteInput,
  CandidateImportInput,
  CreateCandidateInput,
  ListCandidatesQueryInput,
  UpdateCandidateStatusInput,
} from './candidates.schema';
import { CandidatesRepository, candidatesRepository } from './candidates.repository';
import {
  Candidate,
  CandidateAIEvaluation,
  CandidateListFilters,
  CandidateNote,
  CandidateRow,
  CandidateTimelineEvent,
} from './candidates.type';

const ATS_PASS_SCORE = 70;

const defaultAIEvaluation = (): CandidateAIEvaluation => ({
  overallScore: 0,
  atsScore: 0,
  codingScore: 0,
  communicationScore: 0,
  domainScore: 0,
  summary: 'Pending evaluation',
});

export class CandidatesService {
  constructor(private readonly candidatesRepository: CandidatesRepository) {}

  private mapCandidate(
    row: CandidateRow,
    notes: CandidateNote[],
    timeline: CandidateTimelineEvent[]
  ): Candidate {
    const aiEvaluation = row.ai_evaluation ?? defaultAIEvaluation();

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number,
      resumeUrl: row.resume_url,
      experienceSummary: row.experience_summary,
      profileKeywords: row.profile_keywords ?? [],
      status: row.status,
      aiEvaluation,
      finalDecision: row.final_decision,
      notes,
      timeline,
      appliedAt: row.applied_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private mapSortColumn(sortBy: CandidateListFilters['sortBy']): CandidateListFilters['sortBy'] {
    return sortBy;
  }

  private getGeneratedIdentity(prefix: string): { name: string; email: string } {
    const token = crypto.randomUUID().split('-')[0];
    return {
      name: `Candidate ${prefix}-${token}`,
      email: `candidate-${prefix}-${token}@placeholder.local`,
    };
  }

  async createCandidate(
    companyId: string,
    payload: CreateCandidateInput
  ): Promise<{ candidate: Candidate }> {
    const created = await withTransaction(async (client) => {
      const identity = this.getGeneratedIdentity('manual');
      const candidate = await this.candidatesRepository.createCandidate(
        {
          companyId,
          phoneNumber: payload.phoneNumber,
          name: payload.name ?? identity.name,
          email: payload.email ?? identity.email,
          resumeUrl: payload.resumeUrl ?? '',
          experienceSummary: payload.experienceSummary ?? 'Experience summary not provided',
          profileKeywords: payload.profileKeywords ?? [],
          status: 'pending',
          aiEvaluation: payload.aiEvaluation ?? defaultAIEvaluation(),
          finalDecision: null,
        },
        client
      );

      await this.candidatesRepository.addTimelineEvent(
        candidate.id,
        'applied',
        'Application received',
        `${candidate.name} was added to candidate pipeline.`,
        client
      );

      return candidate;
    });

    return {
      candidate: await this.getCandidateById(companyId, created.id),
    };
  }

  async listCandidates(
    companyId: string,
    query: ListCandidatesQueryInput
  ): Promise<{
    items: Candidate[];
    pagination: { page: number; pageSize: number; total: number };
  }> {
    const filters: CandidateListFilters = {
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      atsResult: query.atsResult,
      sortBy: this.mapSortColumn(query.sortBy),
      sortOrder: query.sortOrder,
    };

    const sortColumnMap: Record<
      CandidateListFilters['sortBy'],
      'applied_at' | 'updated_at' | 'name' | 'status'
    > = {
      appliedAt: 'applied_at',
      updatedAt: 'updated_at',
      name: 'name',
      status: 'status',
    };

    const minAtsScore = filters.atsResult === 'pass' ? ATS_PASS_SCORE : undefined;
    const maxAtsScore = filters.atsResult === 'fail' ? ATS_PASS_SCORE - 1 : undefined;

    const listResult = await this.candidatesRepository.listCandidates({
      companyId,
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search,
      status: filters.status,
      minAtsScore,
      maxAtsScore,
      sortColumn: sortColumnMap[filters.sortBy],
      sortOrder: filters.sortOrder.toUpperCase() as 'ASC' | 'DESC',
    });

    const candidateIds = listResult.rows.map((candidate) => candidate.id);
    const notesRows = await this.candidatesRepository.getNotesByCandidateIds(candidateIds);
    const timelineRows = await this.candidatesRepository.getTimelineByCandidateIds(candidateIds);

    const notesByCandidateId = notesRows.reduce<Record<string, CandidateNote[]>>((acc, row) => {
      const next: CandidateNote = {
        id: row.id,
        text: row.text,
        author: row.author,
        createdAt: row.created_at.toISOString(),
      };
      acc[row.candidate_id] = [...(acc[row.candidate_id] ?? []), next];
      return acc;
    }, {});

    const timelineByCandidateId = timelineRows.reduce<Record<string, CandidateTimelineEvent[]>>(
      (acc, row) => {
        const next: CandidateTimelineEvent = {
          id: row.id,
          type: row.type,
          label: row.label,
          detail: row.detail,
          createdAt: row.created_at.toISOString(),
        };
        acc[row.candidate_id] = [...(acc[row.candidate_id] ?? []), next];
        return acc;
      },
      {}
    );

    const items = listResult.rows.map((row) =>
      this.mapCandidate(row, notesByCandidateId[row.id] ?? [], timelineByCandidateId[row.id] ?? [])
    );

    return {
      items,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: listResult.total,
      },
    };
  }

  async getCandidateById(companyId: string, candidateId: string): Promise<Candidate> {
    const candidate = await this.candidatesRepository.findCandidateById(companyId, candidateId);

    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    const notesRows = await this.candidatesRepository.getNotesByCandidateIds([candidate.id]);
    const timelineRows = await this.candidatesRepository.getTimelineByCandidateIds([candidate.id]);

    const notes = notesRows.map((row) => ({
      id: row.id,
      text: row.text,
      author: row.author,
      createdAt: row.created_at.toISOString(),
    }));

    const timeline = timelineRows.map((row) => ({
      id: row.id,
      type: row.type,
      label: row.label,
      detail: row.detail,
      createdAt: row.created_at.toISOString(),
    }));

    return this.mapCandidate(candidate, notes, timeline);
  }

  async updateCandidateStatus(
    companyId: string,
    candidateId: string,
    payload: UpdateCandidateStatusInput
  ): Promise<Candidate> {
    const updated = await withTransaction(async (client) => {
      const candidate = await this.candidatesRepository.findCandidateById(
        companyId,
        candidateId,
        client
      );
      if (!candidate) {
        throw new NotFoundError('Candidate not found');
      }

      const finalDecision =
        payload.status === 'active' || payload.status === 'pending' ? null : payload.status;
      const next = await this.candidatesRepository.updateCandidateStatus(
        companyId,
        candidateId,
        payload.status,
        finalDecision,
        client
      );

      if (!next) {
        throw new NotFoundError('Candidate not found');
      }

      await this.candidatesRepository.addTimelineEvent(
        candidateId,
        payload.status === 'selected' || payload.status === 'rejected' ? 'decision' : 'status',
        `Status changed to ${payload.status}`,
        payload.detail ?? `Candidate marked as ${payload.status}.`,
        client
      );

      return next;
    });

    return this.getCandidateById(companyId, updated.id);
  }

  async addCandidateNote(
    companyId: string,
    candidateId: string,
    payload: AddCandidateNoteInput
  ): Promise<{ note: CandidateNote; candidateId: string }> {
    const result = await withTransaction(async (client) => {
      const candidate = await this.candidatesRepository.findCandidateById(companyId, candidateId);
      if (!candidate) {
        throw new NotFoundError('Candidate not found');
      }

      const note = await this.candidatesRepository.addCandidateNote(
        candidateId,
        payload.text,
        payload.author ?? 'recruiter',
        client
      );

      await this.candidatesRepository.addTimelineEvent(
        candidateId,
        'note',
        'Note added',
        payload.text,
        client
      );

      return note;
    });

    return {
      note: {
        id: result.id,
        text: result.text,
        author: result.author,
        createdAt: result.created_at.toISOString(),
      },
      candidateId,
    };
  }

  async runCandidateAutomation(
    companyId: string,
    candidateId: string
  ): Promise<{ candidate: Candidate; automation: { action: 'none' | 'status'; summary: string } }> {
    const updated = await withTransaction(async (client) => {
      const candidate = await this.candidatesRepository.findCandidateById(
        companyId,
        candidateId,
        client
      );
      if (!candidate) {
        throw new NotFoundError('Candidate not found');
      }

      if (candidate.status === 'selected' || candidate.status === 'rejected') {
        return {
          row: candidate,
          action: 'none' as const,
          summary: 'No automation applied because candidate is already finalized.',
        };
      }

      const overallScore = Number(candidate.ai_evaluation?.overallScore ?? 0);
      const nextStatus = overallScore >= 70 ? 'active' : overallScore < 40 ? 'rejected' : 'hold';

      if (nextStatus === candidate.status) {
        await this.candidatesRepository.addTimelineEvent(
          candidateId,
          'automation',
          'Automation executed',
          `No status change required. Candidate remains ${candidate.status}.`,
          client
        );
        return {
          row: candidate,
          action: 'none' as const,
          summary: `No status change required. Candidate remains ${candidate.status}.`,
        };
      }

      const finalDecision = nextStatus === 'rejected' ? 'rejected' : null;
      const row = await this.candidatesRepository.updateCandidateStatus(
        companyId,
        candidateId,
        nextStatus,
        finalDecision,
        client
      );

      if (!row) {
        throw new NotFoundError('Candidate not found');
      }

      const summary = `Automation changed status from ${candidate.status} to ${nextStatus}.`;
      await this.candidatesRepository.addTimelineEvent(
        candidateId,
        'automation',
        'Automation executed',
        summary,
        client
      );

      return {
        row,
        action: 'status' as const,
        summary,
      };
    });

    return {
      candidate: await this.getCandidateById(companyId, candidateId),
      automation: {
        action: updated.action,
        summary: updated.summary,
      },
    };
  }

  async importCandidates(
    companyId: string,
    payload: CandidateImportInput
  ): Promise<{
    importedCount: number;
    failedCount: number;
    failures?: Array<{ index: number; reason: string }>;
  }> {
    const failures: Array<{ index: number; reason: string }> = [];
    let importedCount = 0;

    for (let index = 0; index < payload.items.length; index += 1) {
      const item = payload.items[index];

      try {
        await withTransaction(async (client) => {
          const identity = this.getGeneratedIdentity(`import-${index + 1}`);
          const aiEvaluation = item.aiEvaluation ?? defaultAIEvaluation();
          const candidate = await this.candidatesRepository.createCandidate(
            {
              companyId,
              phoneNumber: item.phoneNumber ?? null,
              name: item.name ?? identity.name,
              email: item.email ?? identity.email,
              resumeUrl: item.resumeUrl ?? '',
              experienceSummary: item.experienceSummary ?? 'Experience summary not provided',
              profileKeywords: item.profileKeywords ?? [],
              status: 'pending',
              aiEvaluation,
              finalDecision: null,
            },
            client
          );

          await this.candidatesRepository.addTimelineEvent(
            candidate.id,
            'applied',
            'Application received',
            `${candidate.name} was imported into candidate pipeline.`,
            client
          );
        });

        importedCount += 1;
      } catch (error) {
        failures.push({
          index,
          reason: error instanceof Error ? error.message : 'Unknown import error',
        });
      }
    }

    return {
      importedCount,
      failedCount: failures.length,
      failures: failures.length > 0 ? failures : undefined,
    };
  }
}

export const candidatesService = new CandidatesService(candidatesRepository);
