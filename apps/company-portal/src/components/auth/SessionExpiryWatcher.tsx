import { useEffect } from "react";
import { isSessionExpired } from "../../services/auth";
import { useAuthStore } from "../../stores/useAuthStore";

export const SessionExpiryWatcher = (): null => {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const interval = window.setInterval(() => {
      if (isSessionExpired(session)) {
        logout();
      }
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [logout, session]);

  return null;
};
