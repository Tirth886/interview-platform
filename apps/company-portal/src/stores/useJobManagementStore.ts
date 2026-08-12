import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  CandidateEvaluation,
  CandidateTimelineEvent,
  JobCandidate,
  JobCandidateStatus,
} from "../types/candidates";
import type {
  InterviewStageType,
  JobInterview,
  JobInterviewStatus,
  JobRecord,
  JobStatus,
} from "../types/jobs";
import {
  buildCandidateEvaluation,
  evaluateAutomationForStage,
} from "../utils/candidateEvaluation";

type JobManagementState = {
  jobs: JobRecord[];
  candidates: JobCandidate[];
  interviews: JobInterview[];
  seedDemoData: () => void;
  createJob: (payload: Omit<JobRecord, "id" | "slug" | "createdAt" | "updatedAt">) => string;
  updateJob: (
    id: string,
    payload: Omit<JobRecord, "id" | "slug" | "createdAt" | "updatedAt">
  ) => { ok: boolean; reason?: string };
  deleteJob: (id: string) => void;
  setJobStatus: (id: string, status: JobStatus) => void;
  setJobPublic: (id: string, isPublic: boolean) => void;
  addPublicApplication: (payload: {
    jobSlug: string;
    name: string;
    email: string;
    resumeUrl: string;
    keywordsText?: string;
    experienceSummary?: string;
  }) => { ok: boolean; reason?: string };
  moveCandidateStage: (candidateId: string, stageId: string) => void;
  advanceCandidateStage: (candidateId: string) => { ok: boolean; reason?: string };
  setCandidateStatus: (
    candidateId: string,
    status: JobCandidateStatus,
    detail?: string
  ) => { ok: boolean; reason?: string };
  addCandidateNote: (
    candidateId: string,
    text: string,
    author: string
  ) => { ok: boolean; reason?: string };
  runCandidateAutomation: (candidateId: string) => { ok: boolean; reason?: string };
  scheduleInterview: (payload: {
    candidateId: string;
    stage: InterviewStageType;
    startAt: string;
    durationMinutes: number;
    instructions: string;
  }) => { ok: boolean; reason?: string; interviewId?: string };
  rescheduleInterview: (
    interviewId: string,
    startAt: string,
    durationMinutes: number
  ) => { ok: boolean; reason?: string };
  cancelInterview: (interviewId: string) => { ok: boolean; reason?: string };
  setInterviewStatus: (
    interviewId: string,
    status: JobInterviewStatus,
    aiResult?: string
  ) => { ok: boolean; reason?: string };
};

const STORAGE_KEY = "company-portal.jobs";

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const nowIso = (): string => new Date().toISOString();

const createTimelineEvent = (
  type: CandidateTimelineEvent["type"],
  label: string,
  detail: string
): CandidateTimelineEvent => ({
  id: createId(),
  type,
  label,
  detail,
  createdAt: nowIso(),
});

const getStageName = (job: JobRecord, stageId: string): string =>
  job.workflowStages.find((stage) => stage.id === stageId)?.name ?? "Unknown stage";

const applyAutomation = (candidate: JobCandidate, job: JobRecord): JobCandidate => {
  const automation = evaluateAutomationForStage({
    stages: job.workflowStages,
    currentStageId: candidate.currentStageId,
    overallScore: candidate.aiEvaluation.overallScore,
  });

  if (automation.action === "none" || !automation.status) {
    return candidate;
  }

  const nextTimeline = [
    createTimelineEvent("automation", "Automation", automation.summary),
    ...candidate.timeline,
  ];

  if (automation.action === "advance" && automation.nextStageId) {
    return {
      ...candidate,
      currentStageId: automation.nextStageId,
      status: "active",
      finalDecision: null,
      updatedAt: nowIso(),
      timeline: nextTimeline,
    };
  }

  return {
    ...candidate,
    status: automation.status,
    finalDecision: automation.status === "active" ? null : automation.status,
    updatedAt: nowIso(),
    timeline: nextTimeline,
  };
};

const parseKeywords = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((it) => it.toLowerCase() === item.toLowerCase()) === index);

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "job";

const makeUniqueSlug = (title: string, jobs: JobRecord[]): string => {
  const base = slugify(title);
  const existing = new Set(jobs.map((job) => job.slug));
  if (!existing.has(base)) {
    return base;
  }
  let i = 2;
  while (existing.has(`${base}-${i}`)) {
    i += 1;
  }
  return `${base}-${i}`;
};

export const useJobManagementStore = create<JobManagementState>()(
  persist(
    (set) => ({
      jobs: [],
      candidates: [],
      interviews: [],

      seedDemoData: () => {
        set((state) => {
          // Remove any previously seeded demo data first so re-seeding always works
          const cleanedJobs = state.jobs.filter((job) => job.id !== "demo-job-seed-1");
          const cleanedCandidates = state.candidates.filter(
            (c) => !c.id.startsWith("demo-c-")
          );
          const cleanedInterviews = state.interviews.filter(
            (interview) => !interview.id.startsWith("demo-int-")
          );

          const demoJobId = "demo-job-seed-1";
          const s1 = "demo-stage-s1";
          const s2 = "demo-stage-s2";
          const s3 = "demo-stage-s3";

          const demoJob: JobRecord = {
            id: demoJobId,
            slug: "senior-frontend-engineer-demo",
            title: "Senior Frontend Engineer",
            description:
              "Build modern web applications with React, TypeScript, and cutting-edge tools in a fully remote team.",
            skillKeywords: ["React", "TypeScript", "CSS", "REST APIs", "Git"],
            atsKeywords: ["React", "TypeScript", "JavaScript", "CSS", "Git"],
            expectedAtsScore: 65,
            departmentId: "dept-eng",
            designationId: "desig-fe",
            experienceMinYears: 3,
            experienceMaxYears: 7,
            location: "Remote",
            salaryMin: 80000,
            salaryMax: 130000,
            salaryCurrency: "USD",
            isPublic: true,
            status: "published",
            workflowStages: [
              {
                id: s1,
                name: "Application Review",
                type: "human",
                colorHex: "#6366f1",
                durationMinutes: 30,
              },
              {
                id: s2,
                name: "Technical Screening",
                type: "ai",
                colorHex: "#8b5cf6",
                durationMinutes: 60,
              },
              {
                id: s3,
                name: "Culture Fit Interview",
                type: "human",
                colorHex: "#ec4899",
                durationMinutes: 45,
              },
            ],
            createdAt: "2026-03-01T09:00:00.000Z",
            updatedAt: "2026-03-01T09:00:00.000Z",
          };

          const mkEval = (
            overall: number,
            ats: number
          ): CandidateEvaluation => ({
            overallScore: overall,
            atsScore: ats,
            codingScore: Math.min(100, overall + 4),
            communicationScore: Math.max(0, overall - 6),
            domainScore: overall,
            summary:
              overall >= 80
                ? "Strong candidate with excellent technical depth and relevant project history."
                : overall >= 65
                ? "Solid candidate with good fundamentals. Some areas need verification."
                : "Candidate shows potential but lacks key requirements for this role.",
          });

          const mkTimeline = (
            name: string,
            title: string
          ): CandidateTimelineEvent[] => [
            {
              id: createId(),
              type: "applied",
              label: "Application received",
              detail: `${name} applied for ${title}.`,
              createdAt: "2026-03-15T08:00:00.000Z",
            },
          ];

          const demoCandidates: JobCandidate[] = [
            {
              id: "demo-c-1",
              jobId: demoJobId,
              name: "Aiden Carter",
              email: "aiden.carter@example.com",
              resumeUrl: "",
              experienceSummary:
                "5 years of React and TypeScript experience. Led a migration of a legacy Angular codebase to React 18. Familiar with REST, GraphQL, and CI/CD pipelines.",
              profileKeywords: ["React", "TypeScript", "CSS", "Git"],
              status: "active",
              aiEvaluation: mkEval(85, 78),
              finalDecision: null,
              notes: [],
              timeline: mkTimeline("Aiden Carter", demoJob.title),
              currentStageId: s1,
              appliedAt: "2026-03-15T08:00:00.000Z",
              updatedAt: "2026-03-15T08:00:00.000Z",
            },
            {
              id: "demo-c-2",
              jobId: demoJobId,
              name: "Emma Wilson",
              email: "emma.wilson@example.com",
              resumeUrl: "",
              experienceSummary:
                "2 years experience with Vue.js and basic React. Looking to deepen TypeScript skills. Has worked on e-commerce projects.",
              profileKeywords: ["JavaScript", "CSS"],
              status: "active",
              aiEvaluation: mkEval(52, 41),
              finalDecision: null,
              notes: [],
              timeline: mkTimeline("Emma Wilson", demoJob.title),
              currentStageId: s1,
              appliedAt: "2026-03-16T11:30:00.000Z",
              updatedAt: "2026-03-16T11:30:00.000Z",
            },
            {
              id: "demo-c-3",
              jobId: demoJobId,
              name: "Noah Williams",
              email: "noah.williams@example.com",
              resumeUrl: "",
              experienceSummary:
                "6 years senior frontend at a SaaS company. Deep React, TypeScript, and accessibility expertise. Multiple open-source contributions.",
              profileKeywords: ["React", "TypeScript", "CSS", "REST APIs", "Git"],
              status: "active",
              aiEvaluation: mkEval(92, 90),
              finalDecision: null,
              notes: [],
              timeline: [
                ...mkTimeline("Noah Williams", demoJob.title),
                {
                  id: createId(),
                  type: "stage",
                  label: "Moved to next stage",
                  detail: "Advanced to Technical Screening.",
                  createdAt: "2026-03-17T10:00:00.000Z",
                },
              ],
              currentStageId: s2,
              appliedAt: "2026-03-16T14:00:00.000Z",
              updatedAt: "2026-03-17T10:00:00.000Z",
            },
            {
              id: "demo-c-4",
              jobId: demoJobId,
              name: "Liam Davis",
              email: "liam.davis@example.com",
              resumeUrl: "",
              experienceSummary:
                "4 years building React apps for fintech. Strong TypeScript and unit testing skills. Currently advancing to culture fit stage.",
              profileKeywords: ["React", "TypeScript", "Git"],
              status: "active",
              aiEvaluation: mkEval(76, 68),
              finalDecision: null,
              notes: [],
              timeline: [
                ...mkTimeline("Liam Davis", demoJob.title),
                {
                  id: createId(),
                  type: "stage",
                  label: "Moved to next stage",
                  detail: "Advanced to Culture Fit Interview.",
                  createdAt: "2026-03-18T09:00:00.000Z",
                },
              ],
              currentStageId: s3,
              appliedAt: "2026-03-17T09:00:00.000Z",
              updatedAt: "2026-03-18T09:00:00.000Z",
            },
            {
              id: "demo-c-5",
              jobId: demoJobId,
              name: "Ava Anderson",
              email: "ava.anderson@example.com",
              resumeUrl: "",
              experienceSummary:
                "7 years with major tech companies. Led a design system build from scratch. Expert in React, TypeScript, and cross-browser performance.",
              profileKeywords: ["React", "TypeScript", "CSS", "REST APIs", "Git"],
              status: "selected",
              aiEvaluation: mkEval(95, 93),
              finalDecision: "selected",
              notes: [
                {
                  id: createId(),
                  text: "Exceptional candidate. Strong recommendation from the technical panel.",
                  author: "recruiter",
                  createdAt: "2026-03-20T16:00:00.000Z",
                },
              ],
              timeline: [
                ...mkTimeline("Ava Anderson", demoJob.title),
                {
                  id: createId(),
                  type: "decision",
                  label: "Candidate selected",
                  detail: "Passed all stages and marked as selected.",
                  createdAt: "2026-03-20T16:00:00.000Z",
                },
              ],
              currentStageId: s3,
              appliedAt: "2026-03-15T12:00:00.000Z",
              updatedAt: "2026-03-20T16:00:00.000Z",
            },
            {
              id: "demo-c-6",
              jobId: demoJobId,
              name: "Mia Johnson",
              email: "mia.johnson@example.com",
              resumeUrl: "",
              experienceSummary:
                "3 years React experience. Applied with strong communication but technical gaps noted. Currently on hold pending portfolio review.",
              profileKeywords: ["React", "JavaScript"],
              status: "hold",
              aiEvaluation: mkEval(71, 60),
              finalDecision: "hold",
              notes: [],
              timeline: [
                ...mkTimeline("Mia Johnson", demoJob.title),
                {
                  id: createId(),
                  type: "status",
                  label: "Status changed to hold",
                  detail: "Placed on hold pending portfolio review.",
                  createdAt: "2026-03-17T15:00:00.000Z",
                },
              ],
              currentStageId: s1,
              appliedAt: "2026-03-16T08:30:00.000Z",
              updatedAt: "2026-03-17T15:00:00.000Z",
            },
            {
              id: "demo-c-7",
              jobId: demoJobId,
              name: "James Brown",
              email: "james.brown@example.com",
              resumeUrl: "",
              experienceSummary:
                "Passed technical screening but raised concerns about availability and timeline alignment. Recruiter placed on hold for follow-up.",
              profileKeywords: ["React", "TypeScript", "CSS"],
              status: "hold",
              aiEvaluation: mkEval(68, 62),
              finalDecision: "hold",
              notes: [],
              timeline: [
                ...mkTimeline("James Brown", demoJob.title),
                {
                  id: createId(),
                  type: "stage",
                  label: "Moved to next stage",
                  detail: "Advanced to Technical Screening.",
                  createdAt: "2026-03-18T10:00:00.000Z",
                },
                {
                  id: createId(),
                  type: "status",
                  label: "Status changed to hold",
                  detail: "Placed on hold due to availability conflict.",
                  createdAt: "2026-03-19T14:00:00.000Z",
                },
              ],
              currentStageId: s2,
              appliedAt: "2026-03-17T10:00:00.000Z",
              updatedAt: "2026-03-19T14:00:00.000Z",
            },
            {
              id: "demo-c-8",
              jobId: demoJobId,
              name: "Sophia Martinez",
              email: "sophia.martinez@example.com",
              resumeUrl: "",
              experienceSummary:
                "1 year experience, mostly with jQuery and basic CSS. Does not meet the minimum experience or technical requirements for this role.",
              profileKeywords: ["JavaScript"],
              status: "rejected",
              aiEvaluation: mkEval(35, 22),
              finalDecision: "rejected",
              notes: [],
              timeline: [
                ...mkTimeline("Sophia Martinez", demoJob.title),
                {
                  id: createId(),
                  type: "decision",
                  label: "Status changed to rejected",
                  detail: "Does not meet minimum technical requirements.",
                  createdAt: "2026-03-16T13:00:00.000Z",
                },
              ],
              currentStageId: s1,
              appliedAt: "2026-03-16T09:00:00.000Z",
              updatedAt: "2026-03-16T13:00:00.000Z",
            },
            {
              id: "demo-c-9",
              jobId: demoJobId,
              name: "Oliver Taylor",
              email: "oliver.taylor@example.com",
              resumeUrl: "",
              experienceSummary:
                "4 years building React dashboards for analytics SaaS products. Strong TypeScript fundamentals and experience with data visualisation libraries.",
              profileKeywords: ["React", "TypeScript", "JavaScript"],
              status: "pending",
              aiEvaluation: mkEval(74, 66),
              finalDecision: null,
              notes: [],
              timeline: mkTimeline("Oliver Taylor", demoJob.title),
              currentStageId: s1,
              appliedAt: "2026-04-03T14:30:00.000Z",
              updatedAt: "2026-04-03T14:30:00.000Z",
            },
            {
              id: "demo-c-10",
              jobId: demoJobId,
              name: "Charlotte Lee",
              email: "charlotte.lee@example.com",
              resumeUrl: "",
              experienceSummary:
                "Fresh graduate with internship experience in React and Node.js. Contributed to an open-source component library during final year project.",
              profileKeywords: ["React", "CSS", "Git"],
              status: "pending",
              aiEvaluation: mkEval(61, 55),
              finalDecision: null,
              notes: [],
              timeline: mkTimeline("Charlotte Lee", demoJob.title),
              currentStageId: s1,
              appliedAt: "2026-04-03T16:10:00.000Z",
              updatedAt: "2026-04-03T16:10:00.000Z",
            },
          ];

          const demoInterviews: JobInterview[] = [
            {
              id: "demo-int-1",
              candidateId: "demo-c-1",
              jobId: demoJobId,
              stage: "ai-interview",
              status: "scheduled",
              startAt: "2026-04-06T09:00:00.000Z",
              durationMinutes: 45,
              instructions: "Assess ATS fit, communication, and role motivation.",
              interviewLink: "https://interviews.example.com/demo-int-1",
              aiResult: null,
              createdAt: "2026-04-04T08:00:00.000Z",
              updatedAt: "2026-04-04T08:00:00.000Z",
            },
            {
              id: "demo-int-2",
              candidateId: "demo-c-3",
              jobId: demoJobId,
              stage: "coding",
              status: "in-progress",
              startAt: "2026-04-04T10:30:00.000Z",
              durationMinutes: 60,
              instructions: "Live coding session for component architecture and problem solving.",
              interviewLink: "https://interviews.example.com/demo-int-2",
              aiResult: null,
              createdAt: "2026-04-03T12:00:00.000Z",
              updatedAt: "2026-04-04T10:30:00.000Z",
            },
            {
              id: "demo-int-3",
              candidateId: "demo-c-4",
              jobId: demoJobId,
              stage: "ai-interview",
              status: "completed",
              startAt: "2026-04-02T14:00:00.000Z",
              durationMinutes: 45,
              instructions: "Structured behavioral + communication review.",
              interviewLink: "https://interviews.example.com/demo-int-3",
              aiResult: "Strong communication and structured problem framing. Recommend advancing.",
              createdAt: "2026-04-01T09:15:00.000Z",
              updatedAt: "2026-04-02T15:00:00.000Z",
            },
            {
              id: "demo-int-4",
              candidateId: "demo-c-8",
              jobId: demoJobId,
              stage: "coding",
              status: "cancelled",
              startAt: "2026-04-01T16:00:00.000Z",
              durationMinutes: 60,
              instructions: "Coding interview cancelled by recruiter.",
              interviewLink: "https://interviews.example.com/demo-int-4",
              aiResult: null,
              createdAt: "2026-03-31T18:00:00.000Z",
              updatedAt: "2026-04-01T12:00:00.000Z",
            },
          ];

          return {
            jobs: [demoJob, ...cleanedJobs],
            candidates: [...demoCandidates, ...cleanedCandidates],
            interviews: [...demoInterviews, ...cleanedInterviews],
          };
        });
      },

      createJob: (payload) => {
        const id = createId();
        set((state) => {
          const slug = makeUniqueSlug(payload.title, state.jobs);
          const next: JobRecord = {
            id,
            slug,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            ...payload,
          };
          return {
            jobs: [next, ...state.jobs],
          };
        });
        return id;
      },

      updateJob: (id, payload) => {
        let didUpdate = false;
        set((state) => {
          const existing = state.jobs.find((job) => job.id === id);
          if (!existing) {
            return state;
          }
          didUpdate = true;
          const titleChanged = existing.title.trim().toLowerCase() !== payload.title.trim().toLowerCase();
          const nextSlug = titleChanged
            ? makeUniqueSlug(payload.title, state.jobs.filter((job) => job.id !== id))
            : existing.slug;

          return {
            jobs: state.jobs.map((job) =>
              job.id === id
                ? {
                    ...job,
                    ...payload,
                    slug: nextSlug,
                    updatedAt: nowIso(),
                  }
                : job
            ),
          };
        });

        if (!didUpdate) {
          return { ok: false, reason: "Job not found" };
        }
        return { ok: true };
      },

      deleteJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
          candidates: state.candidates.filter((candidate) => candidate.jobId !== id),
          interviews: state.interviews.filter((interview) => interview.jobId !== id),
        })),

      setJobStatus: (id, status) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? {
                  ...job,
                  status,
                  updatedAt: nowIso(),
                }
              : job
          ),
        })),

      setJobPublic: (id, isPublic) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? {
                  ...job,
                  isPublic,
                  updatedAt: nowIso(),
                }
              : job
          ),
        })),

      addPublicApplication: (payload) => {
        const cleanName = payload.name.trim();
        const cleanEmail = payload.email.trim().toLowerCase();
        if (!cleanName) {
          return { ok: false, reason: "Name is required" };
        }
        if (!cleanEmail || !cleanEmail.includes("@")) {
          return { ok: false, reason: "Valid email is required" };
        }

        let ok = false;
        let reason = "Job not found";
        set((state) => {
          const job = state.jobs.find((item) => item.slug === payload.jobSlug && item.isPublic);
          if (!job) {
            reason = "Public job not available";
            return state;
          }

          const firstStageId = job.workflowStages[0]?.id ?? "";
          const profileKeywords = parseKeywords(payload.keywordsText ?? "");
          const aiEvaluation = buildCandidateEvaluation(job, profileKeywords);
          const nextCandidate: JobCandidate = {
            id: createId(),
            jobId: job.id,
            name: cleanName,
            email: cleanEmail,
            resumeUrl: payload.resumeUrl.trim(),
            experienceSummary: payload.experienceSummary?.trim() || "Experience summary not provided",
            profileKeywords,
            status: "pending",
            aiEvaluation,
            finalDecision: null,
            notes: [],
            timeline: [
              createTimelineEvent(
                "applied",
                "Application received",
                `${cleanName} applied for ${job.title}.`
              ),
            ],
            currentStageId: firstStageId,
            appliedAt: nowIso(),
            updatedAt: nowIso(),
          };

          const automatedCandidate = applyAutomation(nextCandidate, job);

          ok = true;
          reason = "";

          return {
            candidates: [automatedCandidate, ...state.candidates],
          };
        });

        if (!ok) {
          return { ok: false, reason };
        }
        return { ok: true };
      },

      moveCandidateStage: (candidateId, stageId) =>
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.id === candidateId
              ? (() => {
                  const job = state.jobs.find((item) => item.id === candidate.jobId);
                  if (!job) {
                    return candidate;
                  }
                  return {
                    ...candidate,
                    currentStageId: stageId,
                    status: "active",
                    finalDecision: null,
                    updatedAt: nowIso(),
                    timeline: [
                      createTimelineEvent(
                        "stage",
                        "Manual stage move",
                        `Moved to ${getStageName(job, stageId)} by recruiter override.`
                      ),
                      ...candidate.timeline,
                    ],
                  };
                })()
              : candidate
          ),
        })),

      advanceCandidateStage: (candidateId) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Candidate not found" };

        set((state) => {
          const candidate = state.candidates.find((item) => item.id === candidateId);
          if (!candidate) {
            return state;
          }
          const job = state.jobs.find((item) => item.id === candidate.jobId);
          if (!job) {
            result = { ok: false, reason: "Job not found" };
            return state;
          }

          const currentIndex = job.workflowStages.findIndex((stage) => stage.id === candidate.currentStageId);
          const nextStage = job.workflowStages[currentIndex + 1];
          result = { ok: true };

          return {
            candidates: state.candidates.map((item) => {
              if (item.id !== candidateId) {
                return item;
              }
              if (!nextStage) {
                return {
                  ...item,
                  status: "selected",
                  finalDecision: "selected",
                  updatedAt: nowIso(),
                  timeline: [
                    createTimelineEvent(
                      "decision",
                      "Candidate selected",
                      "Moved through the final pipeline stage and marked selected."
                    ),
                    ...item.timeline,
                  ],
                };
              }
              return {
                ...item,
                currentStageId: nextStage.id,
                status: "active",
                finalDecision: null,
                updatedAt: nowIso(),
                timeline: [
                  createTimelineEvent(
                    "stage",
                    "Moved to next stage",
                    `Advanced to ${nextStage.name}.`
                  ),
                  ...item.timeline,
                ],
              };
            }),
          };
        });

        return result;
      },

      setCandidateStatus: (candidateId, status, detail) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Candidate not found" };

        set((state) => {
          const exists = state.candidates.some((candidate) => candidate.id === candidateId);
          if (!exists) {
            return state;
          }

          result = { ok: true };

          return {
            candidates: state.candidates.map((candidate) =>
              candidate.id === candidateId
                ? {
                    ...candidate,
                    status,
                    finalDecision: status === "active" ? null : status,
                    updatedAt: nowIso(),
                    timeline: [
                      createTimelineEvent(
                        status === "selected" || status === "rejected" ? "decision" : "status",
                        `Status changed to ${status}`,
                        detail ?? `Candidate marked as ${status}.`
                      ),
                      ...candidate.timeline,
                    ],
                  }
                : candidate
            ),
          };
        });

        return result;
      },

      addCandidateNote: (candidateId, text, author) => {
        const cleanText = text.trim();
        if (!cleanText) {
          return { ok: false, reason: "Note cannot be empty" };
        }

        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Candidate not found" };
        set((state) => {
          const exists = state.candidates.some((candidate) => candidate.id === candidateId);
          if (!exists) {
            return state;
          }
          result = { ok: true };
          return {
            candidates: state.candidates.map((candidate) =>
              candidate.id === candidateId
                ? {
                    ...candidate,
                    updatedAt: nowIso(),
                    notes: [
                      {
                        id: createId(),
                        text: cleanText,
                        author: author.trim() || "Recruiter",
                        createdAt: nowIso(),
                      },
                      ...candidate.notes,
                    ],
                    timeline: [
                      createTimelineEvent("note", "Note added", cleanText),
                      ...candidate.timeline,
                    ],
                  }
                : candidate
            ),
          };
        });

        return result;
      },

      runCandidateAutomation: (candidateId) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Candidate not found" };
        set((state) => {
          const candidate = state.candidates.find((item) => item.id === candidateId);
          if (!candidate) {
            return state;
          }
          const job = state.jobs.find((item) => item.id === candidate.jobId);
          if (!job) {
            result = { ok: false, reason: "Job not found" };
            return state;
          }
          result = { ok: true };

          return {
            candidates: state.candidates.map((item) =>
              item.id === candidateId ? applyAutomation(item, job) : item
            ),
          };
        });

        return result;
      },

      scheduleInterview: (payload) => {
        const cleanStartAt = payload.startAt.trim();
        if (!cleanStartAt) {
          return { ok: false, reason: "Interview start date/time is required" };
        }

        const parsed = new Date(cleanStartAt);
        if (Number.isNaN(parsed.getTime())) {
          return { ok: false, reason: "Interview start date/time is invalid" };
        }

        const duration = Math.max(15, Math.round(payload.durationMinutes || 0));
        let result: { ok: boolean; reason?: string; interviewId?: string } = {
          ok: false,
          reason: "Candidate not found",
        };

        set((state) => {
          const candidate = state.candidates.find((item) => item.id === payload.candidateId);
          if (!candidate) {
            return state;
          }

          const job = state.jobs.find((item) => item.id === candidate.jobId);
          if (!job) {
            result = { ok: false, reason: "Job not found" };
            return state;
          }

          const interviewId = createId();
          const now = nowIso();
          const interview: JobInterview = {
            id: interviewId,
            candidateId: candidate.id,
            jobId: candidate.jobId,
            stage: payload.stage,
            status: "scheduled",
            startAt: parsed.toISOString(),
            durationMinutes: duration,
            instructions: payload.instructions.trim(),
            interviewLink: `https://interviews.example.com/${interviewId}`,
            aiResult: null,
            createdAt: now,
            updatedAt: now,
          };

          result = { ok: true, interviewId };

          return {
            interviews: [interview, ...state.interviews],
            candidates: state.candidates.map((item) =>
              item.id === candidate.id
                ? {
                    ...item,
                    status: item.status === "pending" ? "active" : item.status,
                    updatedAt: now,
                    timeline: [
                      createTimelineEvent(
                        "stage",
                        "Interview scheduled",
                        `${payload.stage === "ai-interview" ? "AI Interview" : "Coding"} scheduled for ${parsed.toISOString().replace("T", " ").slice(0, 16)}.`
                      ),
                      ...item.timeline,
                    ],
                  }
                : item
            ),
            jobs: state.jobs.map((item) =>
              item.id === job.id
                ? {
                    ...item,
                    updatedAt: now,
                  }
                : item
            ),
          };
        });

        return result;
      },

      rescheduleInterview: (interviewId, startAt, durationMinutes) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Interview not found" };
        const parsed = new Date(startAt);
        if (Number.isNaN(parsed.getTime())) {
          return { ok: false, reason: "Interview start date/time is invalid" };
        }

        set((state) => {
          const interview = state.interviews.find((item) => item.id === interviewId);
          if (!interview) {
            return state;
          }

          result = { ok: true };
          return {
            interviews: state.interviews.map((item) =>
              item.id === interviewId
                ? {
                    ...item,
                    startAt: parsed.toISOString(),
                    durationMinutes: Math.max(15, Math.round(durationMinutes || item.durationMinutes)),
                    status: item.status === "cancelled" ? "scheduled" : item.status,
                    updatedAt: nowIso(),
                  }
                : item
            ),
          };
        });

        return result;
      },

      cancelInterview: (interviewId) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Interview not found" };

        set((state) => {
          const exists = state.interviews.some((interview) => interview.id === interviewId);
          if (!exists) {
            return state;
          }

          result = { ok: true };
          return {
            interviews: state.interviews.map((item) =>
              item.id === interviewId
                ? {
                    ...item,
                    status: "cancelled",
                    updatedAt: nowIso(),
                  }
                : item
            ),
          };
        });

        return result;
      },

      setInterviewStatus: (interviewId, status, aiResult) => {
        let result: { ok: boolean; reason?: string } = { ok: false, reason: "Interview not found" };

        set((state) => {
          const exists = state.interviews.some((interview) => interview.id === interviewId);
          if (!exists) {
            return state;
          }

          result = { ok: true };
          return {
            interviews: state.interviews.map((item) =>
              item.id === interviewId
                ? {
                    ...item,
                    status,
                    aiResult:
                      status === "completed"
                        ? (aiResult?.trim() || item.aiResult)
                        : item.aiResult,
                    updatedAt: nowIso(),
                  }
                : item
            ),
          };
        });

        return result;
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 5,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<JobManagementState> | undefined) ?? {};
        const persistedJobs = persisted.jobs ?? currentState.jobs;
        const persistedCandidates = persisted.candidates ?? currentState.candidates;
        const persistedInterviews = persisted.interviews ?? currentState.interviews;

        return {
          ...currentState,
          ...persisted,
          jobs: persistedJobs.map((job) => ({
            ...job,
            skillKeywords: job.skillKeywords ?? [],
            atsKeywords: job.atsKeywords ?? [],
            expectedAtsScore:
              typeof job.expectedAtsScore === "number"
                ? Math.min(100, Math.max(0, job.expectedAtsScore))
                : 70,
            workflowStages: (job.workflowStages ?? []).map((stage) => ({
              ...stage,
              aiAgentId: stage.aiAgentId,
            })),
          })),
          candidates: persistedCandidates.map((candidate) => ({
            ...candidate,
            experienceSummary: candidate.experienceSummary ?? "Experience summary not provided",
            profileKeywords: candidate.profileKeywords ?? [],
            status: candidate.status ?? "active",
            aiEvaluation:
              candidate.aiEvaluation ??
              buildCandidateEvaluation(
                persistedJobs.find((job) => job.id === candidate.jobId) ?? {
                  skillKeywords: [],
                  atsKeywords: [],
                },
                candidate.profileKeywords ?? []
              ),
            finalDecision: candidate.finalDecision ?? null,
            notes: candidate.notes ?? [],
            timeline: candidate.timeline ?? [],
            updatedAt: candidate.updatedAt ?? candidate.appliedAt ?? nowIso(),
          })),
          interviews: persistedInterviews.map((interview) => ({
            ...interview,
            stage: interview.stage ?? "ai-interview",
            status: interview.status ?? "scheduled",
            durationMinutes:
              typeof interview.durationMinutes === "number"
                ? Math.max(15, Math.round(interview.durationMinutes))
                : 45,
            instructions: interview.instructions ?? "",
            interviewLink: interview.interviewLink ?? `https://interviews.example.com/${interview.id}`,
            aiResult: interview.aiResult ?? null,
            createdAt: interview.createdAt ?? nowIso(),
            updatedAt: interview.updatedAt ?? interview.createdAt ?? nowIso(),
          })),
        };
      },
    }
  )
);
