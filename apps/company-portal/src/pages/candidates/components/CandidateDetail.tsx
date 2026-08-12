import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
import { useAuthStore } from "../../../stores/useAuthStore";
import { useJobManagementStore } from "../../../stores/useJobManagementStore";
import type { JobCandidateStatus } from "../../../types/candidates";
import { formatDateTime } from "../../../utils/dateUtils";

const statusVariant = (
  status: JobCandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") {
    return "success";
  }
  if (status === "hold") {
    return "warning";
  }
  if (status === "rejected") {
    return "destructive";
  }
  return "secondary";
};

export default function CandidateDetailPage(): JSX.Element {
  const { candidateId = "" } = useParams();

  const session = useAuthStore((state) => state.session);
  const jobs = useJobManagementStore((state) => state.jobs);
  const candidates = useJobManagementStore((state) => state.candidates);
  const moveCandidateStage = useJobManagementStore((state) => state.moveCandidateStage);
  const advanceCandidateStage = useJobManagementStore((state) => state.advanceCandidateStage);
  const setCandidateStatus = useJobManagementStore((state) => state.setCandidateStatus);
  const addCandidateNote = useJobManagementStore((state) => state.addCandidateNote);
  const runCandidateAutomation = useJobManagementStore((state) => state.runCandidateAutomation);

  const [noteText, setNoteText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidate = candidates.find((item) => item.id === candidateId) ?? null;
  const job = jobs.find((item) => item.id === candidate?.jobId) ?? null;

  const currentStage = useMemo(
    () => job?.workflowStages.find((stage) => stage.id === candidate?.currentStageId) ?? null,
    [candidate?.currentStageId, job]
  );

  if (!candidate || !job) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Candidate Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The candidate record does not exist or the related job was removed.
        </p>
        <Button asChild variant="outline">
          <Link to="/app/candidates">Back to Candidates</Link>
        </Button>
      </div>
    );
  }

  const handleStatus = (status: JobCandidateStatus, detail: string): void => {
    const result = setCandidateStatus(candidate.id, status, detail);
    if (!result.ok) {
      setError(result.reason ?? "Unable to update candidate status");
      return;
    }
    setError(null);
    setMessage(`Candidate marked as ${status}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">
            Candidate profile, AI evaluation, timeline, and decision controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(candidate.status)}>{candidate.status}</Badge>
          <Button asChild variant="outline">
            <Link to={`/app/candidates?jobId=${job.id}`}>Back to Candidates</Link>
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Personal info, resume, skills, and experience summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{candidate.email}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Job Applied</p>
                  <p className="text-sm font-medium">{job.title}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Stage</p>
                  <p className="text-sm font-medium">{currentStage?.name ?? "Unassigned"}</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Applied On</p>
                  <p className="text-sm font-medium">{formatDateTime(candidate.appliedAt)}</p>
                </div>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
                <p className="mt-1 text-sm text-foreground">{candidate.experienceSummary}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Resume</p>
                  {candidate.resumeUrl ? (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Open Resume
                    </a>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-foreground">
                  {candidate.resumeUrl || "Resume link not provided."}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Skills</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {candidate.profileKeywords.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No profile keywords submitted.</span>
                  ) : (
                    candidate.profileKeywords.map((keyword) => (
                      <span key={keyword} className="rounded-full border border-border px-2 py-0.5 text-xs">
                        {keyword}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Timeline</CardTitle>
              <CardDescription>Track every system and recruiter update on this candidate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidate.timeline.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No timeline activity yet.
                </div>
              ) : (
                candidate.timeline.map((event) => (
                  <div key={event.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{event.label}</p>
                      <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Evaluation</CardTitle>
              <CardDescription>Overall score, breakdown, and automated summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall Score</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">
                  {candidate.aiEvaluation.overallScore}%
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{candidate.aiEvaluation.summary}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Coding</p>
                  <p className="text-lg font-semibold">{candidate.aiEvaluation.codingScore}%</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Communication</p>
                  <p className="text-lg font-semibold">{candidate.aiEvaluation.communicationScore}%</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Domain</p>
                  <p className="text-lg font-semibold">{candidate.aiEvaluation.domainScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manual override is always available, with automation on demand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Move Candidate To Stage</label>
                <Select
                  value={candidate.currentStageId}
                  onValueChange={(value) => {
                    moveCandidateStage(candidate.id, value);
                    setMessage("Candidate stage updated");
                    setError(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {job.workflowStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const result = advanceCandidateStage(candidate.id);
                    if (!result.ok) {
                      setError(result.reason ?? "Unable to move to next stage");
                      return;
                    }
                    setMessage("Candidate advanced");
                    setError(null);
                  }}
                >
                  Move To Next Stage
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const result = runCandidateAutomation(candidate.id);
                    if (!result.ok) {
                      setError(result.reason ?? "Unable to run automation");
                      return;
                    }
                    setMessage("Automation executed");
                    setError(null);
                  }}
                >
                  Run Automation
                </Button>
                <Button variant="outline" onClick={() => handleStatus("hold", "Candidate placed on hold for manual follow-up.")}>
                  Hold
                </Button>
                <Button variant="destructive" onClick={() => handleStatus("rejected", "Candidate rejected after manual review.")}>
                  Reject
                </Button>
                <Button onClick={() => handleStatus("selected", "Candidate selected for the role.")}>Mark Selected</Button>
              </div>
              {candidate.finalDecision && (
                <p className="text-xs text-muted-foreground">
                  Final decision recorded: {candidate.finalDecision}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Recruiters and hiring managers can leave evaluation notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Add Note</label>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Add interviewer feedback, concerns, or decision notes"
                />
              </div>
              <Button
                onClick={() => {
                  const result = addCandidateNote(
                    candidate.id,
                    noteText,
                    session?.user.role ?? "recruiter"
                  );
                  if (!result.ok) {
                    setError(result.reason ?? "Unable to save note");
                    return;
                  }
                  setNoteText("");
                  setMessage("Note added");
                  setError(null);
                }}
              >
                Save Note
              </Button>
              {candidate.notes.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No notes recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {candidate.notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{note.author}</p>
                        <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{note.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}