import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@shared/ui";
import {
  getQaTest,
  submitQaTest,
  type QaTestPayload,
  type QaTestResult,
} from "../../services/qaTest";
import { useInterviewSessionStore } from "../../stores/useInterviewSessionStore";

export default function SessionTestPage(): JSX.Element {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { activeSession, activeRole, activeUser, joined, setValidatedSession, markJoined } =
    useInterviewSessionStore((state) => state);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState<QaTestPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QaTestResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async (): Promise<void> => {
      if (!sessionId) {
        setError("Missing session id.");
        setLoading(false);
        return;
      }

      if (
        activeSession &&
        activeSession.id === sessionId &&
        activeSession.sessionMode !== "qa-test" &&
        activeSession.roundType !== "qa-evaluation"
      ) {
        navigate(`/session/${sessionId}/room`, { replace: true });
        return;
      }

      try {
        const data = await getQaTest({
          sessionId,
          role: activeRole ?? "candidate",
          user: activeUser,
        });
        if (cancelled) return;

        setValidatedSession(data.session, "candidate", data.session.candidateEmail);
        if (!joined) {
          markJoined();
        }
        setTest(data.test);
        setResult(data.test.result);
        setLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load Q&A test.");
        setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    activeRole,
    activeSession,
    activeUser,
    joined,
    markJoined,
    navigate,
    sessionId,
    setValidatedSession,
  ]);

  const unansweredCount = useMemo(() => {
    if (!test) return 0;
    return test.questions.filter((question) => !answers[question.id]).length;
  }, [answers, test]);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!sessionId || !test || test.alreadySubmitted || result) return;

    if (unansweredCount > 0) {
      setError(`Please answer all questions (${unansweredCount} remaining).`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = await submitQaTest({
        sessionId,
        role: activeRole ?? "candidate",
        user: activeUser,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      });
      setValidatedSession(payload.session, "candidate", payload.session.candidateEmail);
      setResult(payload.result);
      setTest((current) =>
        current
          ? {
              ...current,
              alreadySubmitted: true,
              result: payload.result,
            }
          : current
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit answers.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading Q&A evaluation…
        </div>
      </div>
    );
  }

  if (error && !test) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Q&A Access Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={sessionId ? `/session/${sessionId}` : "/"}>Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!test) {
    return <div />;
  }

  const done = Boolean(result) || test.alreadySubmitted;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Q&A Evaluation
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {activeSession?.title ?? "Evaluation"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeSession?.durationMinutes ?? "—"} min · {test.questions.length} question
          {test.questions.length === 1 ? "" : "s"}
        </p>
        {activeSession?.instructions ? (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
            {activeSession.instructions}
          </p>
        ) : null}
      </div>

      {done && result ? (
        <Card className="mb-6 border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-emerald-900">Submitted</CardTitle>
            <CardDescription className="text-emerald-800">
              Score: {result.scorePercent}% ({result.correctCount}/{result.totalCount} correct)
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        {test.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {index + 1}.{" "}
                <span className={question.isCodeView ? "font-mono text-sm" : undefined}>
                  {question.questionText}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm",
                      selected
                        ? "border-sky-400 bg-sky-50 text-sky-950"
                        : "border-border hover:border-slate-300",
                      done && "cursor-default opacity-90"
                    )}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      name={question.id}
                      value={option.id}
                      checked={selected}
                      disabled={done}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                    />
                    <span className={option.isCodeView ? "font-mono text-xs" : undefined}>
                      {option.optionText}
                    </span>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!done ? (
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Submitting…" : "Submit answers"}
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/">Done</Link>
          </Button>
        )}
      </form>
    </div>
  );
}
