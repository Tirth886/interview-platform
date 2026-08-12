import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session } from "../types/auth";
import { isSessionExpired } from "../services/auth";

type AuthState = {
  session: Session | null;
  verificationEmail: string | null;
  verificationCodeHint: string | null;
  setSession: (session: Session) => void;
  logout: () => void;
  hydrateSession: () => void;
  setVerificationContext: (email: string, codeHint?: string | null) => void;
  clearVerificationContext: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      verificationEmail: null,
      verificationCodeHint: null,
      setSession: (session) =>
        set({
          session,
          verificationEmail: null,
          verificationCodeHint: null,
        }),
      logout: () => set({ session: null }),
      hydrateSession: () => {
        const currentSession = get().session;
        if (isSessionExpired(currentSession)) {
          set({ session: null });
        }
      },
      setVerificationContext: (email, codeHint) =>
        set({ verificationEmail: email, verificationCodeHint: codeHint ?? null }),
      clearVerificationContext: () =>
        set({ verificationEmail: null, verificationCodeHint: null }),
    }),
    {
      name: "company-portal.auth.session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        session: state.session,
        verificationEmail: state.verificationEmail,
        verificationCodeHint: state.verificationCodeHint,
      }),
    }
  )
);
