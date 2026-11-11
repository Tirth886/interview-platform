import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@shared/ui";
import {
  getScheduleInvite,
  submitScheduleInvite,
  type PublicScheduleInvite,
  type SubmitScheduleResult,
} from "../../services/schedule";

const toLocalInputValue = (date: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const roundTypeLabel = (roundType: string): string => {
  if (roundType === "human-interview") return "Human interview";
  if (roundType === "qa-evaluation") return "Q&A evaluation";
  if (roundType === "coding") return "Coding interview";
  return "AI interview";
};

export default function SchedulePage(): JSX.Element {
  const { token = "" } = useParams();
  const [invite, setInvite] = useState<PublicScheduleInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitScheduleResult | null>(null);
  const [startAtLocal, setStartAtLocal] = useState(() => {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    soon.setMinutes(0, 0, 0);
    return toLocalInputValue(soon);
  });

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      if (!token) {
        setError("Missing schedule token.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getScheduleInvite(token);
        if (!cancelled) {
          setInvite(data);
          if (data.status === "scheduled" && data.scheduledStartAt) {
            setStartAtLocal(toLocalInputValue(new Date(data.scheduledStartAt)));
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load invite.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const minLocal = useMemo(() => toLocalInputValue(new Date()), []);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    if (!token || !invite || invite.status !== "pending") return;

    const startAt = new Date(startAtLocal);
    if (Number.isNaN(startAt.getTime())) {
      setError("Pick a valid date and time.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const submitted = await submitScheduleInvite(token, startAt.toISOString());
      setResult(submitted);
      setInvite((current) =>
        current
          ? {
              ...current,
              status: "scheduled",
              scheduledStartAt: submitted.invite.scheduledStartAt,
            }
          : current
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <p className="text-sm text-muted-foreground">Loading schedule invite…</p>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Schedule unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return <div />;
  }

  const alreadyScheduled = invite.status === "scheduled" || Boolean(result);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{invite.stageLabel}</CardTitle>
          <CardDescription>
            {invite.companyName} · {roundTypeLabel(invite.roundType)} · {invite.durationMinutes}{" "}
            minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hello
            </p>
            <p className="text-sm text-foreground">{invite.candidateName}</p>
          </div>

          {invite.stageDescription ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Stage description
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">{invite.stageDescription}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a date and time that works for this interview stage.
            </p>
          )}

          {alreadyScheduled ? (
            <div className="space-y-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              <p className="font-medium">You&apos;re scheduled.</p>
              <p>
                {new Date(
                  result?.invite.scheduledStartAt ?? invite.scheduledStartAt ?? ""
                ).toLocaleString()}
              </p>
              {result?.invite.sessionUrl ? (
                <Button asChild>
                  <a href={result.invite.sessionUrl}>Open interview session</a>
                </Button>
              ) : null}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="start-at">Date and time</Label>
                <Input
                  id="start-at"
                  type="datetime-local"
                  min={minLocal}
                  value={startAtLocal}
                  onChange={(event) => setStartAtLocal(event.target.value)}
                  required
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Saving…" : "Confirm schedule"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
