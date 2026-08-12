import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import NotFoundPage from "../pages/not-found";

const SessionPreboardingPage = lazy(() => import("../pages/session-preboarding"));
const AccessRequiredPage = lazy(() => import("../pages/access-required"));
const InterviewRoomPage = lazy(() => import("../pages/interview-room"));

const PageLoader = (): JSX.Element => (
  <div className="flex h-32 items-center justify-center">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <AccessRequiredPage />
      </Suspense>
    ),
  },
  {
    path: "/session/:sessionId",
    element: (
      <Suspense fallback={<PageLoader />}>
        <SessionPreboardingPage />
      </Suspense>
    ),
  },
  {
    path: "/session/:sessionId/room",
    element: (
      <Suspense fallback={<PageLoader />}>
        <InterviewRoomPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
