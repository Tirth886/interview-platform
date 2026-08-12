import { Navigate, Outlet } from "react-router-dom";
import { isSessionExpired } from "../../services/auth";
import { useAuthStore } from "../../stores/useAuthStore";

export const PublicOnlyRoute = (): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  if (session && !isSessionExpired(session)) {
    return <Navigate to="/app" replace />;
  }

  if (session && isSessionExpired(session)) {
    logout();
  }

  return <Outlet />;
};
