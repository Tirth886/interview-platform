import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import {
  getCandidateById,
  requestCandidateParse,
  sendCandidateScheduleInvite,
  updateCandidateStage,
  type CandidateStatus,
} from "../../../services/candidates";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { getWorkflowStageOptions } from "../../../utils/workflowStages";
import { formatDateTime } from "../../../utils/dateUtils";

const statusVariant = (
  status: CandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") return "success";
  if (status === "hold") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

export default function CandidateDetailPage(): JSX.Element {
  const { candidateId = "" } = useParams();
  const session = useAuthStore((state) => state.session);
  const workflows = useSettingsStore((state) => state.workflows);
  const hydrateWorkflows = useSettingsStore((state) => state.hydrateWorkflows);
  const [message, setMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [scheduleUrl, setScheduleUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    void hydrateWorkflows(session.token);
  }, [session?.token, hydrateWorkflows]);

  const candidateQuery = useQuery({
    queryKey: ["backend-candidate", candidateId, session?.token],
    queryFn: () => {
      if (!session?.token || !candidateId) {
        return Promise.reject(new Error("Missing session or candidate id"));
      }
      return getCandidateById(candidateId, session.token);
    },
    enabled: Boolean(session?.token && candidateId),
  });

  const candidate = candidateQuery.data;
  const workflow = useMemo(
    () => workflows.find((item) => item.id === candidate?.workflowId) ?? null,
    [workflows, candidate?.workflowId]
  );
  const stages = useMemo(() => getWorkflowStageOptions(workflow), [workflow]);
  const currentStageIndex = stages.findIndex((stage) => stage.id === candidate?.currentStageId);

  const handleMoveStage = async (stageId: string): Promise<void> => {
    if (!session?.token || !candidate) return;
    const stage = stages.find((item) => item.id === stageId);
    try {
      await updateCandidateStage(
        candidate.id,
        { stageId, detail: `Moved to stage "${stage?.label ?? stageId}".` },
        session.token
      );
      setMessage(`Moved to "${stage?.label ?? stageId}".`);
      void candidateQuery.refetch();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to update stage.");
    }
  };

  const handleParse = async (): Promise<void> => {
    if (!session?.token || !candidate) return;
    setIsParsing(true);
    try {
      await requestCandidateParse(candidate.id, session.token);
      setMessage("Resume parse queued.");
      void candidateQuery.refetch();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to queue parse.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSendScheduleInvite = async (): Promise<void> => {
    if (!session?.token || !candidate) return;
    setIsSendingInvite(true);
    try {
      const result = await sendCandidateScheduleInvite(candidate.id, session.token, {
        resend: true,
      });
      setScheduleUrl(result.invite.scheduleUrl);
      const delivery =
        result.email.mode === "resend" && result.email.delivered
          ? `Email sent to ${result.email.to}.`
          : `Invite ready (email logged — set RESEND_API_KEY to deliver). Sent to ${result.email.to}.`;
      setMessage(
        `${delivery} Stage: "${result.invite.stageLabel}". Link copied below.`
      );
      void candidateQuery.refetch();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to send schedule invite.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  if (candidateQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading candidate…</p>;
  }

  if (candidateQuery.isError || !candidate) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Candidate Not Found</h1>
        <Button asChild variant="outline">
          <Link to="/app/candidates">Back to Candidates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{candidate.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {candidate.currentJobTitle ?? "No job title yet"}
            {candidate.batchName ? ` · Batch: ${candidate.batchName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/app/candidates">Back</Link>
          </Button>
          {candidate.resumeUrl ? (
            <Button asChild variant="outline">
              <a href={candidate.resumeUrl} target="_blank" rel="noreferrer">
                Resume
              </a>
            </Button>
          ) : null}
          <Button variant="outline" disabled={isParsing || !candidate.resumeUrl} onClick={() => void handleParse()}>
            {isParsing ? "Queuing…" : "Parse"}
          </Button>
          <Button
            disabled={isSendingInvite || !candidate.workflowId}
            onClick={() => void handleSendScheduleInvite()}
          >
            {isSendingInvite ? "Sending…" : "Send schedule invite"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {scheduleUrl ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs break-all">
          {scheduleUrl}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Parsed contact and skill details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{candidate.email.includes("@placeholder.local") ? "—" : candidate.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm">{candidate.phoneNumber ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Workflow</p>
                <p className="text-sm">{workflow?.name ?? candidate.workflowId ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusVariant(candidate.status)} className="mt-1 capitalize">
                  {candidate.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ATS score</p>
                <p className="text-sm">
                  {candidate.latestAtsScore != null ? candidate.latestAtsScore : "Pending"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-muted-foreground">Links</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {candidate.links?.linkedin ? (
                  <a
                    href={
                      candidate.links.linkedin.startsWith("http")
                        ? candidate.links.linkedin
                        : `https://${candidate.links.linkedin}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    LinkedIn
                  </a>
                ) : null}
                {candidate.links?.github ? (
                  <a
                    href={
                      candidate.links.github.startsWith("http")
                        ? candidate.links.github
                        : `https://${candidate.links.github}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    GitHub
                  </a>
                ) : null}
                {candidate.links?.portfolio ? (
                  <a
                    href={
                      candidate.links.portfolio.startsWith("http")
                        ? candidate.links.portfolio
                        : `https://${candidate.links.portfolio}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-700 underline-offset-2 hover:underline"
                  >
                    Portfolio
                  </a>
                ) : null}
                {!candidate.links?.linkedin &&
                !candidate.links?.github &&
                !candidate.links?.portfolio ? (
                  <span className="text-muted-foreground">No links extracted yet.</span>
                ) : null}
              </div>
            </div>

            {(candidate.workflows?.length ?? 0) > 0 ? (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Workflow history</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {candidate.workflows.map((item) => {
                    const wf = workflows.find((w) => w.id === item.workflowId);
                    return (
                      <li key={item.id}>
                        {wf?.name ?? item.workflowId}
                        {item.batchName ? ` · ${item.batchName}` : ""}
                        {` · ${item.status}`}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-xs text-muted-foreground">Skills</p>
              {candidate.profileKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {candidate.profileKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills extracted yet.</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs text-muted-foreground">Summary</p>
              <p className="text-sm text-muted-foreground">{candidate.experienceSummary}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage progress</CardTitle>
            <CardDescription>Current workflow stage for this candidate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No stages found on the linked workflow.
              </p>
            ) : (
              <>
                <ol className="space-y-2">
                  {stages.map((stage, index) => {
                    const isCurrent = stage.id === candidate.currentStageId;
                    const isDone = currentStageIndex >= 0 && index < currentStageIndex;
                    return (
                      <li
                        key={stage.id}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          isCurrent
                            ? "border-sky-300 bg-sky-50 text-sky-900"
                            : isDone
                              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        <span className="font-medium">{index + 1}. {stage.label}</span>
                        {isCurrent ? (
                          <span className="ml-2 text-xs">Current</span>
                        ) : isDone ? (
                          <span className="ml-2 text-xs">Done</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Move to stage</p>
                  <Select
                    value={candidate.currentStageId ?? undefined}
                    onValueChange={(value) => void handleMoveStage(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Recent activity for this candidate.</CardDescription>
        </CardHeader>
        <CardContent>
          {candidate.timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No timeline events yet.</p>
          ) : (
            <ul className="space-y-3">
              {candidate.timeline.map((event) => (
                <li key={event.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
