import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export const AdminOnlyRoute = (): JSX.Element => {
  const location = useLocation();
  const session = useAuthStore((state) => state.session);

  if (session?.user.role !== "admin") {
    return <Navigate to="/app" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
