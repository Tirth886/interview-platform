import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@shared/ui";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { StepIdentityVerification } from "./components/StepIdentityVerification";
import { StepPersonalInfo } from "./components/StepPersonalInfo";
import { StepPreparation } from "./components/StepPreparation";
import { runCompatibilityChecks } from "../../utils/compatibility";
import {
  joinInterviewSession,
  validateSessionAccess,
} from "../../services/sessionValidation";
import { useInterviewSessionStore } from "../../stores/useInterviewSessionStore";
import type { SessionAccessState } from "../../types/session";
import { preboardingStepLabels } from "../../constants/preboarding";
import { toAccessError } from "../../utils/sessionAccess";
import { getSessionActivityPath } from "../../utils/sessionDestination";

export default function SessionPreboardingPage(): JSX.Element {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role") ?? undefined;
  const userParam = searchParams.get("user") ?? undefined;

  const {
    activeSession,
    activeRole,
    activeUser,
    profile,
    identityCaptureDataUrl,
    checks,
    steps,
    joined,
    setValidatedSession,
    setIdentityCapture,
    completeStep,
    markJoined,
  } = useInterviewSessionStore((state) => state);

  const [accessState, setAccessState] = useState<SessionAccessState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      const store = useInterviewSessionStore.getState();

      if (!sessionId) {
        setAccessState({
          status: "error",
          title: "Invalid Interview Link",
          message: "Missing session id in the URL.",
        });
        return;
      }

      const role = roleParam ?? "candidate";
      const user = userParam;

      if (store.activeSession?.id !== sessionId) {
        store.resetForSession(sessionId);
      }

      const validation = await validateSessionAccess({ sessionId, role, user });
      if (cancelled) {
        return;
      }

      if (!validation.ok) {
        setAccessState(toAccessError(validation));
        return;
      }

      store.setValidatedSession(validation.session, validation.role, validation.user);
      if (validation.session.status === "in-progress") {
        const reopenResult = await joinInterviewSession({
          sessionId,
          role: validation.role,
          user: validation.user,
        });

        if (!reopenResult.ok) {
          setAccessState(toAccessError(reopenResult));
          return;
        }

        store.setValidatedSession(reopenResult.session, reopenResult.role, reopenResult.user);
        store.markJoined();
        navigate(getSessionActivityPath(sessionId, reopenResult.session));
        return;
      }

      const compatibility = await runCompatibilityChecks();
      if (cancelled) {
        return;
      }
      store.setChecks(compatibility);
      setAccessState({ status: "ready" });
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [navigate, sessionId, roleParam, userParam]);

  const activeStep = useMemo(() => {
    if (!steps.step1) {
      return 1;
    }
    if (!steps.step2) {
      return 2;
    }
    return 3;
  }, [steps.step1, steps.step2]);

  if (accessState.status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Validating interview session...
        </div>
      </div>
    );
  }

  if (accessState.status === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{accessState.title}</CardTitle>
            <CardDescription>{accessState.message}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild>
              <Link to="/">Go to Interview Portal</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeSession) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading session details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Interview Portal Pre-Boarding
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{activeSession.title}</h1>
        <p className="text-sm text-muted-foreground">
          {activeSession.jobTitle} • {activeSession.durationMinutes} min
        </p>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-3">
        {preboardingStepLabels.map((label, index) => {
          const stepNo = index + 1;
          const completed =
            (stepNo === 1 && steps.step1) ||
            (stepNo === 2 && steps.step2) ||
            (stepNo === 3 && steps.step3);
          const current = activeStep === stepNo;
          return (
            <div
              key={label}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm",
                current ? "border-primary bg-primary/5" : "border-border bg-white",
                completed && "text-foreground",
                !completed && !current && "text-muted-foreground"
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide">Step {stepNo}</p>
              <p className="font-medium">{label}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {!steps.step1 && (
          <StepPersonalInfo
            name={profile.name}
            email={profile.email}
            checks={checks}
            onSubmit={() => {
              completeStep("step1");
            }}
          />
        )}

        {steps.step1 && !steps.step2 && (
          <StepIdentityVerification
            existingCapture={identityCaptureDataUrl}
            checks={checks}
            onCapture={(dataUrl) => setIdentityCapture(dataUrl)}
            onContinue={() => completeStep("step2")}
          />
        )}

        {steps.step1 && steps.step2 && !joined && (
          <StepPreparation
            checks={checks}
            requireScreenShareBeforeJoin={false}
            onJoinNow={async () => {
              if (!sessionId) {
                setAccessState({
                  status: "error",
                  title: "Invalid Interview Link",
                  message: "Missing session id when trying to join the interview.",
                });
                return;
              }

              const joinResult = await joinInterviewSession({
                sessionId,
                role: activeRole ?? "candidate",
                user: activeUser,
              });

              if (!joinResult.ok) {
                setAccessState(toAccessError(joinResult));
                return;
              }

              setValidatedSession(joinResult.session, joinResult.role, joinResult.user);
              completeStep("step3");
              markJoined();
              navigate(getSessionActivityPath(sessionId, joinResult.session));
            }}
          />
        )}

        {joined && (
          <Card>
            <CardHeader>
              <CardTitle>
                {activeSession.sessionMode === "qa-test" ||
                activeSession.roundType === "qa-evaluation"
                  ? "Q&A Evaluation Ready"
                  : "Interview Session Ready"}
              </CardTitle>
              <CardDescription>
                Pre-boarding completed. Your session is active and persisted for this interview.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {activeSession.sessionMode === "qa-test" ||
                activeSession.roundType === "qa-evaluation"
                  ? "You are ready to take the Q&A evaluation."
                  : "You are now ready to proceed to the live interview room."}
              </p>
              <Button asChild>
                <Link to={getSessionActivityPath(sessionId ?? "", activeSession)}>
                  {activeSession.sessionMode === "qa-test" ||
                  activeSession.roundType === "qa-evaluation"
                    ? "Open Q&A Test"
                    : "Open Interview Room"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
