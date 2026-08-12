import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isSessionExpired } from "../../services/auth";
import { useAuthStore } from "../../stores/useAuthStore";

export const ProtectedRoute = (): JSX.Element => {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);

  if (!session || isSessionExpired(session)) {
    if (session) {
      logout();
    }
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
