import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CompatibilityCheck, InterviewSessionRecord, SessionRole } from "../types/session";

type StepState = {
  step1: boolean;
  step2: boolean;
  step3: boolean;
};

type InterviewSessionState = {
  activeSession: InterviewSessionRecord | null;
  activeRole: SessionRole | null;
  activeUser: string;
  validatedAt: string | null;
  profile: {
    name: string;
    email: string;
  };
  identityCaptureDataUrl: string | null;
  checks: CompatibilityCheck[];
  steps: StepState;
  joined: boolean;
  setValidatedSession: (session: InterviewSessionRecord, role: SessionRole, user: string) => void;
  setProfile: (name: string, email: string) => void;
  setIdentityCapture: (dataUrl: string | null) => void;
  setChecks: (checks: CompatibilityCheck[]) => void;
  completeStep: (key: keyof StepState) => void;
  markJoined: () => void;
  resetForSession: (sessionId: string) => void;
  resetAll: () => void;
};

const initialSteps = (): StepState => ({
  step1: false,
  step2: false,
  step3: false,
});

const STORAGE_KEY = "interview-portal.session";

export const useInterviewSessionStore = create<InterviewSessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      activeRole: null,
      activeUser: "",
      validatedAt: null,
      profile: {
        name: "",
        email: "",
      },
      identityCaptureDataUrl: null,
      checks: [],
      steps: initialSteps(),
      joined: false,

      setValidatedSession: (session, role, user) => {
        const current = get().activeSession;
        if (current?.id !== session.id) {
          set({
            activeSession: session,
            activeRole: role,
            activeUser: user,
            validatedAt: new Date().toISOString(),
            profile: {
              name: session.candidateName,
              email: session.candidateEmail,
            },
            identityCaptureDataUrl: null,
            checks: [],
            steps: initialSteps(),
            joined: false,
          });
          return;
        }

        set({
          activeSession: session,
          activeRole: role,
          activeUser: user,
          validatedAt: new Date().toISOString(),
        });
      },

      setProfile: (name, email) =>
        set({
          profile: {
            name,
            email,
          },
        }),

      setIdentityCapture: (dataUrl) => set({ identityCaptureDataUrl: dataUrl }),

      setChecks: (checks) => set({ checks }),

      completeStep: (key) =>
        set((state) => ({
          steps: {
            ...state.steps,
            [key]: true,
          },
        })),

      markJoined: () => set({ joined: true }),

      resetForSession: (sessionId) => {
        const current = get().activeSession;
        if (!current || current.id !== sessionId) {
          set({
            activeSession: null,
            activeRole: null,
            activeUser: "",
            validatedAt: null,
            profile: { name: "", email: "" },
            identityCaptureDataUrl: null,
            checks: [],
            steps: initialSteps(),
            joined: false,
          });
        }
      },

      resetAll: () =>
        set({
          activeSession: null,
          activeRole: null,
          activeUser: "",
          validatedAt: null,
          profile: { name: "", email: "" },
          identityCaptureDataUrl: null,
          checks: [],
          steps: initialSteps(),
          joined: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
