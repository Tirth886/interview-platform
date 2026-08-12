import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  DashboardActivity,
  DashboardCandidate,
  DashboardInterview,
} from "../types/dashboard";

type DashboardState = {
  candidates: DashboardCandidate[];
  interviews: DashboardInterview[];
  activities: DashboardActivity[];
};

const DASHBOARD_STORAGE_KEY = "company-portal.dashboard";

const now = new Date();
const hoursAgo = (n: number): string => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString();

const seededState: DashboardState = {
  candidates: [
    { id: "cand-001", name: "Aarav Mehta", stage: "screening", appliedAt: hoursAgo(28) },
    { id: "cand-002", name: "Sara Khan", stage: "interview", appliedAt: hoursAgo(26) },
    { id: "cand-003", name: "Dev Patel", stage: "selected", appliedAt: hoursAgo(48) },
    { id: "cand-004", name: "Maya Roy", stage: "applied", appliedAt: hoursAgo(9) },
    { id: "cand-005", name: "Nikhil Rao", stage: "screening", appliedAt: hoursAgo(19) },
    { id: "cand-006", name: "Ira Singh", stage: "interview", appliedAt: hoursAgo(11) },
  ],
  interviews: [
    { id: "int-001", candidateId: "cand-002", status: "in-progress", startedAt: hoursAgo(1) },
    { id: "int-002", candidateId: "cand-006", status: "in-progress", startedAt: hoursAgo(3) },
    { id: "int-003", candidateId: "cand-003", status: "completed", startedAt: hoursAgo(14) },
  ],
  activities: [
    { id: "act-001", type: "new_application", text: "New application received for Product Designer", createdAt: hoursAgo(2) },
    { id: "act-002", type: "candidate_moved", text: "Sara Khan moved to Interview stage", createdAt: hoursAgo(4) },
    { id: "act-003", type: "interview_completed", text: "Interview completed for Dev Patel", createdAt: hoursAgo(8) },
    { id: "act-004", type: "ai_auto_screened", text: "12 candidates auto-screened today", createdAt: hoursAgo(3), count: 12 },
    { id: "act-005", type: "ai_shortlisted", text: "5 candidates shortlisted by AI", createdAt: hoursAgo(6), count: 5 },
  ],
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    () => seededState,
    {
      name: DASHBOARD_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<DashboardState> | undefined) ?? {};
        return {
          ...currentState,
          ...persisted,
          candidates: persisted.candidates ?? currentState.candidates,
          interviews: persisted.interviews ?? currentState.interviews,
          activities: persisted.activities ?? currentState.activities,
        };
      },
    }
  )
);
