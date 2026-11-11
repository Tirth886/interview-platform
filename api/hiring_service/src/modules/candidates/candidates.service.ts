import crypto from 'crypto';
import { NotFoundError, ValidationError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import { publishResumeParseRequested } from '../../providers/messaging/rabbitmq';
import {
  AddCandidateNoteInput,
  BatchCreateCandidatesInput,
  CreateCandidateInput,
  CandidateImportInput,
  ListCandidatesQueryInput,
  UpdateCandidateStatusInput,
} from './candidates.schema';
import {
  CandidateParseRepository,
  candidateParseRepository,
  ResumeParseRow,
} from './candidate-parse.repository';
import { CandidatesRepository, candidatesRepository } from './candidates.repository';
import {
  Candidate,
  CandidateAIEvaluation,
  CandidateLinks,
  CandidateListFilters,
  CandidateNote,
  CandidateRow,
  CandidateTimelineEvent,
  CandidateWorkflowSummary,
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

const emptyLinks = (): CandidateLinks => ({
  linkedin: null,
  github: null,
  portfolio: null,
});

const linksFromParse = (parse: ResumeParseRow | null): CandidateLinks => {
  if (!parse?.personal_information) return emptyLinks();
  const personal = parse.personal_information;
  const asString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;
  return {
    linkedin: asString(personal.linkedin),
    github: asString(personal.github),
    portfolio: asString(personal.portfolio),
  };
};

export class CandidatesService {
  constructor(
    private readonly candidatesRepository: CandidatesRepository,
    private readonly parseRepository: CandidateParseRepository = candidateParseRepository
  ) {}

  private mapCandidate(
    row: CandidateRow,
    notes: CandidateNote[],
    timeline: CandidateTimelineEvent[],
    links: CandidateLinks = emptyLinks(),
    workflows: CandidateWorkflowSummary[] = []
  ): Candidate {
    const aiEvaluation = row.ai_evaluation ?? defaultAIEvaluation();

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phoneNumber: row.phone_number,
      resumeUrl: row.resume_url,
      workflowId: row.workflow_id ?? null,
      batchName: row.batch_name ?? null,
      currentJobTitle: row.current_job_title ?? null,
      currentStageId: row.current_stage_id ?? null,
      latestParseId: row.latest_parse_id ?? null,
      latestAtsAttemptId: row.latest_ats_attempt_id ?? null,
      latestAtsScore: row.latest_ats_score ?? null,
      experienceSummary: row.experience_summary,
      profileKeywords: row.profile_keywords ?? [],
      status: row.status,
      aiEvaluation,
      finalDecision: row.final_decision,
      links,
      workflows,
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
          workflowId: payload.workflowId ?? null,
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
    const latestParse = await this.parseRepository.getLatestResumeParse(candidate.id);
    const workflowRows = await this.parseRepository.listCandidateWorkflows(candidate.id);

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

    const workflows: CandidateWorkflowSummary[] = workflowRows.map((row) => ({
      id: row.id,
      workflowId: row.workflow_id,
      batchName: row.batch_name,
      currentStageId: row.current_stage_id,
      status: row.status,
      resumeUrl: row.resume_url,
      appliedAt: row.applied_at.toISOString(),
    }));

    return this.mapCandidate(
      candidate,
      notes,
      timeline,
      linksFromParse(latestParse),
      workflows
    );
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
              workflowId: null,
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

  async batchCreateFromResumes(
    companyId: string,
    payload: BatchCreateCandidatesInput
  ): Promise<{
    createdCount: number;
    failedCount: number;
    candidates: Candidate[];
    failures?: Array<{ index: number; fileName: string; reason: string }>;
  }> {
    const failures: Array<{ index: number; fileName: string; reason: string }> = [];
    const createdIds: string[] = [];

    for (let index = 0; index < payload.resumes.length; index += 1) {
      const resume = payload.resumes[index];

      try {
        const created = await withTransaction(async (client) => {
          const identity = this.getGeneratedIdentity(`resume-${index + 1}`);

          const candidate = await this.candidatesRepository.createCandidate(
            {
              companyId,
              phoneNumber: null,
              // Do not use PDF filename as the candidate name — wait for ATS parse.
              name: 'Pending parse',
              email: identity.email,
              resumeUrl: resume.url,
              workflowId: payload.workflowId,
              batchName: payload.batchName,
              currentStageId: payload.initialStageId ?? null,
              experienceSummary: 'Resume uploaded — pending parsing',
              profileKeywords: [],
              status: 'pending',
              aiEvaluation: defaultAIEvaluation(),
              finalDecision: null,
            },
            client
          );

          await this.parseRepository.upsertCandidateWorkflow(
            {
              companyId,
              candidateId: candidate.id,
              workflowId: payload.workflowId,
              batchName: payload.batchName,
              currentStageId: payload.initialStageId ?? null,
              status: 'pending',
              resumeUrl: resume.url,
            },
            client
          );

          await this.candidatesRepository.addTimelineEvent(
            candidate.id,
            'applied',
            'Resume uploaded',
            `Resume "${resume.fileName}" uploaded to batch "${payload.batchName}" for workflow ${payload.workflowId}.`,
            client
          );

          return candidate;
        });

        createdIds.push(created.id);

        await publishResumeParseRequested({
          event: 'resume.parse.requested',
          candidate_id: created.id,
          company_id: companyId,
          workflow_id: payload.workflowId,
          resume_key: resume.key,
          resume_url: resume.url,
          file_name: resume.fileName,
        });
      } catch (error) {
        failures.push({
          index,
          fileName: resume.fileName,
          reason: error instanceof Error ? error.message : 'Unknown create error',
        });
      }
    }

    const candidates = await Promise.all(
      createdIds.map((id) => this.getCandidateById(companyId, id))
    );

    return {
      createdCount: candidates.length,
      failedCount: failures.length,
      candidates,
      failures: failures.length > 0 ? failures : undefined,
    };
  }

  async applyParseResultByCandidateId(
    candidateId: string,
    parsed: Record<string, unknown>
  ): Promise<{ candidate: Candidate }> {
    const existing = await this.candidatesRepository.findCandidateByIdGlobal(candidateId);
    if (!existing) {
      throw new NotFoundError('Candidate not found');
    }
    return this.applyParseResult(existing.company_id, candidateId, parsed);
  }

  async applyParseResult(
    companyId: string,
    candidateId: string,
    parsed: Record<string, unknown>
  ): Promise<{ candidate: Candidate }> {
    const existing = await this.candidatesRepository.findCandidateById(companyId, candidateId);
    if (!existing) {
      throw new NotFoundError('Candidate not found');
    }

    const personal =
      parsed.personal_information && typeof parsed.personal_information === 'object'
        ? (parsed.personal_information as Record<string, unknown>)
        : {};

    const skills =
      parsed.skills && typeof parsed.skills === 'object'
        ? (parsed.skills as Record<string, unknown>)
        : {};

    const skillKeywords = Object.values(skills)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .slice(0, 50);

    const parsedFullName =
      typeof personal.full_name === 'string' && personal.full_name.trim()
        ? personal.full_name.trim()
        : undefined;
    const email =
      typeof personal.email === 'string' && personal.email.trim()
        ? personal.email.trim().toLowerCase()
        : undefined;
    const phone =
      typeof personal.phone === 'string' && personal.phone.trim()
        ? personal.phone.trim()
        : undefined;
    const summary =
      typeof parsed.professional_summary === 'string' && parsed.professional_summary.trim()
        ? parsed.professional_summary.trim()
        : undefined;

    const meta =
      parsed.meta && typeof parsed.meta === 'object'
        ? (parsed.meta as Record<string, unknown>)
        : {};
    const originalName =
      typeof meta.original_name === 'string' && meta.original_name.trim()
        ? meta.original_name.trim()
        : undefined;
    const nameFromFile = this.deriveNameFromFileName(originalName);
    const fullName = this.pickPersonName(parsedFullName, nameFromFile);

    const experience = Array.isArray(parsed.experience) ? parsed.experience : [];
    const firstRole = experience.find(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item)
    );
    const rawTitle =
      firstRole && typeof firstRole.designation === 'string'
        ? firstRole.designation.trim()
        : undefined;
    const currentJobTitle = rawTitle
      ? rawTitle.split('|')[0]?.trim() || rawTitle
      : undefined;

    if (
      !fullName &&
      !email &&
      !phone &&
      !summary &&
      skillKeywords.length === 0 &&
      !currentJobTitle
    ) {
      throw new ValidationError('Parsed resume did not contain usable fields.');
    }

    const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

    const updated = await withTransaction(async (client) => {
      // Dedupe: same company + real email → reuse existing person, attach workflow
      let targetId = candidateId;
      let targetRow = existing;

      if (email) {
        const matched = await this.candidatesRepository.findCandidateByEmail(
          companyId,
          email,
          client
        );
        if (matched && matched.id !== candidateId) {
          targetId = matched.id;
          targetRow = matched;

          // Move this upload's workflow onto the canonical candidate
          if (existing.workflow_id) {
            await this.parseRepository.upsertCandidateWorkflow(
              {
                companyId,
                candidateId: targetId,
                workflowId: existing.workflow_id,
                batchName: existing.batch_name,
                currentStageId: existing.current_stage_id,
                status: 'pending',
                resumeUrl: existing.resume_url,
              },
              client
            );
          }

          await this.candidatesRepository.addTimelineEvent(
            targetId,
            'applied',
            'Re-applied to workflow',
            `Same candidate matched by email; attached workflow ${existing.workflow_id ?? 'n/a'} with latest resume.`,
            client
          );

          // Drop the temporary placeholder candidate created at upload time
          await this.candidatesRepository.deleteCandidate(candidateId, client);
        }
      }

      const parseRow = await this.parseRepository.createResumeParse(
        {
          companyId,
          candidateId: targetId,
          workflowId: existing.workflow_id ?? targetRow.workflow_id,
          resumeKey: null,
          resumeUrl: existing.resume_url || targetRow.resume_url,
          fileName: originalName ?? null,
          status: 'completed',
          personalInformation: personal,
          professionalSummary: summary ?? null,
          totalExperience:
            typeof parsed.total_experience === 'string' ? parsed.total_experience : null,
          skills,
          experience: asArray(parsed.experience),
          education: asArray(parsed.education),
          projects: asArray(parsed.projects),
          certifications: asArray(parsed.certifications),
          languages: asArray(parsed.languages),
          achievements: asArray(parsed.achievements),
          internships: asArray(parsed.internships),
          meta,
          rawPayload: parsed,
        },
        client
      );

      const workflowId = existing.workflow_id ?? targetRow.workflow_id;

      const row = await this.candidatesRepository.applyParsedResume(
        companyId,
        targetId,
        {
          name: fullName,
          email,
          phoneNumber: phone ?? null,
          experienceSummary: summary,
          profileKeywords: skillKeywords.length > 0 ? skillKeywords : undefined,
          currentJobTitle,
          latestParseId: parseRow.id,
          resumeUrl: existing.resume_url || undefined,
          workflowId: workflowId ?? undefined,
          batchName: existing.batch_name ?? undefined,
          currentStageId: existing.current_stage_id ?? undefined,
          parsedResume: parsed,
        },
        client
      );

      if (!row) {
        throw new NotFoundError('Candidate not found');
      }

      if (workflowId) {
        const cw = await this.parseRepository.upsertCandidateWorkflow(
          {
            companyId,
            candidateId: targetId,
            workflowId,
            batchName: existing.batch_name ?? row.batch_name,
            currentStageId: existing.current_stage_id ?? row.current_stage_id,
            status: row.status,
            resumeUrl: row.resume_url,
            latestParseId: parseRow.id,
          },
          client
        );

        // Queue ATS attempt shell (scoring engine can fill result later)
        const attempt = await this.parseRepository.createStageAttempt(
          {
            companyId,
            candidateId: targetId,
            workflowId,
            candidateWorkflowId: cw.id,
            workflowStageId: row.current_stage_id,
            stageType: 'ats',
            status: 'pending',
            result: {
              ats_score: null,
              max_score: 100,
              ats_status: 'Pending ATS evaluation',
              category_scores: {},
              overall_feedback: 'Awaiting ATS scoring against workflow JD.',
              resume_parse_id: parseRow.id,
              workflow_id: workflowId,
            },
            resumeParseId: parseRow.id,
            evaluatedBy: 'system',
          },
          client
        );

        await this.candidatesRepository.setLatestAtsAttempt(
          companyId,
          targetId,
          attempt.id,
          null,
          client
        );
      }

      // Store profile links as metadata for quick lookup / custom fields later
      const linkFields: Array<[string, unknown]> = [
        ['linkedin', personal.linkedin],
        ['github', personal.github],
        ['portfolio', personal.portfolio],
        ['location', personal.location],
      ];
      for (const [key, value] of linkFields) {
        if (typeof value === 'string' && value.trim()) {
          await this.parseRepository.upsertMetadata(
            companyId,
            targetId,
            key,
            value.trim(),
            'parse',
            parseRow.id,
            client
          );
        }
      }

      await this.candidatesRepository.addTimelineEvent(
        targetId,
        'automation',
        'Resume parsed',
        'Structured resume fields were saved to parse history.',
        client
      );

      return row;
    });

    return {
      candidate: await this.getCandidateById(companyId, updated.id),
    };
  }

  private isTitleLikeName(value: string): boolean {
    const titleTokens = new Set([
      'software',
      'engineer',
      'developer',
      'senior',
      'junior',
      'full',
      'stack',
      'fullstack',
      'frontend',
      'backend',
      'manager',
      'architect',
      'intern',
      'consultant',
      'analyst',
      'lead',
      'director',
    ]);
    const tokens = value
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.replace(/[^a-z]/g, ''))
      .filter(Boolean);
    if (tokens.length === 0) return true;
    const hits = tokens.filter((token) => titleTokens.has(token)).length;
    return hits >= 1 && hits / tokens.length >= 0.4;
  }

  private deriveNameFromFileName(originalName?: string): string | undefined {
    if (!originalName) return undefined;
    const cleaned = originalName
      .replace(/\.[^.]+$/, '')
      .replace(/\b(resume|cv|curriculum|vitae)\b/gi, ' ')
      .replace(/[_\-]+/g, ' ')
      .replace(/\d+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleaned || this.isTitleLikeName(cleaned)) return undefined;
    const tokens = cleaned.split(' ').filter(Boolean);
    if (tokens.length < 2 || tokens.length > 4) return undefined;
    return tokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()).join(' ');
  }

  private pickPersonName(
    parsedName?: string,
    fileName?: string
  ): string | undefined {
    if (parsedName && !this.isTitleLikeName(parsedName)) {
      return parsedName;
    }
    if (fileName && !this.isTitleLikeName(fileName)) {
      return fileName;
    }
    return undefined;
  }

  private extractResumeKey(resumeUrl: string): string | null {
    const marker = '/uploads/';
    const idx = resumeUrl.indexOf(marker);
    if (idx >= 0) {
      const key = resumeUrl.slice(idx + marker.length).split('?')[0]?.trim();
      return key || null;
    }
    // Already a storage key like "resumes/uuid-file.pdf"
    if (resumeUrl.includes('/') && !resumeUrl.startsWith('http')) {
      return resumeUrl.trim();
    }
    return null;
  }

  async updateCandidateStage(
    companyId: string,
    candidateId: string,
    payload: { stageId: string; detail?: string }
  ): Promise<Candidate> {
    const updated = await withTransaction(async (client) => {
      const existing = await this.candidatesRepository.findCandidateById(
        companyId,
        candidateId,
        client
      );
      if (!existing) {
        throw new NotFoundError('Candidate not found');
      }

      const row = await this.candidatesRepository.updateCandidateStage(
        companyId,
        candidateId,
        payload.stageId,
        client
      );
      if (!row) {
        throw new NotFoundError('Candidate not found');
      }

      await this.candidatesRepository.addTimelineEvent(
        candidateId,
        'status',
        'Stage updated',
        payload.detail ?? `Candidate moved to stage ${payload.stageId}.`,
        client
      );

      return row;
    });

    // Best-effort: email schedule link when moved onto an AI/Human interview stage
    try {
      const { scheduleInvitesService } = await import('../schedule-invites/schedule-invites.service');
      await scheduleInvitesService.createInviteForCandidate(companyId, candidateId, {
        workflowNodeId: payload.stageId,
      });
    } catch {
      // Stage may be ATS/Q&A or email may still be placeholder — ignore
    }

    return this.getCandidateById(companyId, updated.id);
  }

  async requestResumeParse(
    companyId: string,
    candidateId: string
  ): Promise<{ queued: boolean; candidate: Candidate }> {
    const candidate = await this.candidatesRepository.findCandidateById(companyId, candidateId);
    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    if (!candidate.resume_url) {
      throw new ValidationError('Candidate has no resume to parse.');
    }

    const resumeKey = this.extractResumeKey(candidate.resume_url);
    if (!resumeKey) {
      throw new ValidationError('Unable to resolve resume storage key for parsing.');
    }

    const fileName = resumeKey.split('/').pop() ?? resumeKey;

    await publishResumeParseRequested({
      event: 'resume.parse.requested',
      candidate_id: candidate.id,
      company_id: companyId,
      workflow_id: candidate.workflow_id,
      resume_key: resumeKey,
      resume_url: candidate.resume_url,
      file_name: fileName,
    });

    await this.candidatesRepository.addTimelineEvent(
      candidateId,
      'automation',
      'Parse requested',
      'Manual resume parse was queued for ATS processing.'
    );

    return {
      queued: true,
      candidate: await this.getCandidateById(companyId, candidateId),
    };
  }
}

export const candidatesService = new CandidatesService(candidatesRepository);
