import type { InterviewSessionRecord } from "../types/session";

export const DEMO_SESSION_ID = "always-demo";
export const DEMO_CANDIDATE_EMAIL = "demo.candidate@example.com";
export const DEMO_CANDIDATE_LINK = `/session/${DEMO_SESSION_ID}?role=candidate&user=${encodeURIComponent(DEMO_CANDIDATE_EMAIL)}`;

export const mockInterviewSessions: InterviewSessionRecord[] = [
  {
    id: DEMO_SESSION_ID,
    title: "Reusable Demo Session",
    jobTitle: "Platform Demo",
    candidateName: "Demo Candidate",
    candidateEmail: DEMO_CANDIDATE_EMAIL,
    aiInterviewerName: "Aria",
    scheduledAt: "2026-01-01T09:00:00.000Z",
    expiresAt: "2099-12-31T23:59:59.000Z",
    durationMinutes: 45,
    instructions: "Reusable long-lived demo session for portal validation.",
    status: "scheduled",
  },
  {
    id: "demo-int-1",
    title: "AI Interview Session",
    jobTitle: "Senior Frontend Engineer",
    candidateName: "Aiden Carter",
    candidateEmail: "aiden.carter@example.com",
    aiInterviewerName: "Aria",
    scheduledAt: "2026-04-11T09:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    durationMinutes: 45,
    instructions:
      "Answer clearly and concisely. Explain your approach before diving into implementation details.",
    status: "scheduled",
  },
  {
    id: "demo-int-2",
    title: "Coding Round Session",
    jobTitle: "Senior Frontend Engineer",
    candidateName: "Noah Williams",
    candidateEmail: "noah.williams@example.com",
    aiInterviewerName: "Aria",
    scheduledAt: "2026-04-11T11:00:00.000Z",
    expiresAt: "2026-12-31T23:59:59.000Z",
    durationMinutes: 60,
    instructions:
      "Use readable code and communicate trade-offs while solving the challenge.",
    status: "scheduled",
  },
  {
    id: "expired-int-1",
    title: "Expired Demo Session",
    jobTitle: "Backend Engineer",
    candidateName: "Legacy Candidate",
    candidateEmail: "legacy.candidate@example.com",
    aiInterviewerName: "Aria",
    scheduledAt: "2025-01-10T09:00:00.000Z",
    expiresAt: "2025-01-10T11:00:00.000Z",
    durationMinutes: 45,
    instructions: "Expired session test data.",
    status: "scheduled",
  },
];
