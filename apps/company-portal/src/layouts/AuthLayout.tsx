import { Outlet } from "react-router-dom";

export const AuthLayout = (): JSX.Element => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
