import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "../components/auth/PublicOnlyRoute";
import { AdminOnlyRoute } from "../components/auth/AdminOnlyRoute";
import NotFoundPage from "../pages/not-found";

const LandingPage = lazy(() => import("../pages/landing"));
const LoginPage = lazy(() => import("../pages/auth/login"));
const SignupPage = lazy(() => import("../pages/auth/signup"));
const VerifyEmailPage = lazy(() => import("../pages/auth/verify-email"));
const DashboardPage = lazy(() => import("../pages/dashboard"));
const PublicJobPage = lazy(() => import("../pages/jobs/components/PublicJob"));
const CandidatesPage = lazy(() => import("../pages/candidates"));
const CandidateDetailPage = lazy(() => import("../pages/candidates/components/CandidateDetail"));
const InterviewsPage = lazy(() => import("../pages/interviews"));
const AnalyticsPage = lazy(() => import("../pages/analytics"));
const SettingsPage = lazy(() => import("../pages/settings"));
const JobsPage = lazy(() => import("../pages/jobs"));
const JobDetailPage = lazy(() => import("../pages/jobs/components/JobDetail"));

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
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/jobs/:slug",
    element: (
      <Suspense fallback={<PageLoader />}>
        <PublicJobPage />
      </Suspense>
    ),
  },
  {
    path: "/auth",
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "login",
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: "signup",
            element: (
              <Suspense fallback={<PageLoader />}>
                <SignupPage />
              </Suspense>
            ),
          },
          {
            path: "verify",
            element: (
              <Suspense fallback={<PageLoader />}>
                <VerifyEmailPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: "jobs",
            element: (
              <Suspense fallback={<PageLoader />}>
                <JobsPage />
              </Suspense>
            ),
          },
          {
            path: "jobs/:jobId",
            element: (
              <Suspense fallback={<PageLoader />}>
                <JobDetailPage />
              </Suspense>
            ),
          },
          {
            path: "candidates",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CandidatesPage />
              </Suspense>
            ),
          },
          {
            path: "candidates/:candidateId",
            element: (
              <Suspense fallback={<PageLoader />}>
                <CandidateDetailPage />
              </Suspense>
            ),
          },
          {
            path: "interviews",
            element: (
              <Suspense fallback={<PageLoader />}>
                <InterviewsPage />
              </Suspense>
            ),
          },
          {
            path: "analytics",
            element: (
              <Suspense fallback={<PageLoader />}>
                <AnalyticsPage />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: <AdminOnlyRoute />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
