import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from "@shared/ui";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useJobManagementStore } from "../../../stores/useJobManagementStore";
import type { JobCandidateStatus } from "../../../types/candidates";

const statusVariant = (
  status: JobCandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") return "success";
  if (status === "hold") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const statusLabel: Record<JobCandidateStatus, string> = {
  pending: "Pending",
  active: "Active",
  hold: "On Hold",
  rejected: "Rejected",
  selected: "Selected",
};

const formatDateTime = (value: string): string =>
  value.replace("T", " ").slice(0, 16);

const ScorePill = ({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) => (
  <div className={cn("rounded-lg border p-3 text-center", colorClass)}>
    <p className="text-[11px] font-medium uppercase tracking-wide opacity-75">{label}</p>
    <p className="mt-0.5 text-xl font-bold">{value}%</p>
  </div>
);

interface CandidateDrawerProps {
  candidateId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CandidateDrawer({
  candidateId,
  open,
  onOpenChange,
}: CandidateDrawerProps): JSX.Element {
  const session = useAuthStore((state) => state.session);
  const candidates = useJobManagementStore((state) => state.candidates);
  const jobs = useJobManagementStore((state) => state.jobs);
  const setCandidateStatus = useJobManagementStore((state) => state.setCandidateStatus);
  const moveCandidateStage = useJobManagementStore((state) => state.moveCandidateStage);
  const advanceCandidateStage = useJobManagementStore((state) => state.advanceCandidateStage);
  const addCandidateNote = useJobManagementStore((state) => state.addCandidateNote);

  const [noteText, setNoteText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const candidate = candidates.find((c) => c.id === candidateId) ?? null;
  const job = candidate ? jobs.find((j) => j.id === candidate.jobId) ?? null : null;
  const currentStage = job?.workflowStages.find((s) => s.id === candidate?.currentStageId) ?? null;

  const flash = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatus = (status: JobCandidateStatus, detail: string) => {
    if (!candidate) return;
    const result = setCandidateStatus(candidate.id, status, detail);
    if (!result.ok) {
      flash("error", result.reason ?? "Unable to update status");
    } else {
      flash("success", `Candidate marked as ${statusLabel[status]}`);
    }
  };

  const handleAddNote = () => {
    if (!candidate || !noteText.trim()) return;
    const result = addCandidateNote(
      candidate.id,
      noteText,
      session?.user.role ?? "recruiter"
    );
    if (!result.ok) {
      flash("error", result.reason ?? "Unable to save note");
    } else {
      setNoteText("");
      flash("success", "Note saved");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* ── Header ──────────────────────────────── */}
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">
                {candidate ? candidate.name : "Candidate"}
              </SheetTitle>
              {candidate && (
                <SheetDescription className="mt-0.5 truncate">{candidate.email}</SheetDescription>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {candidate && (
                <>
                  <Badge variant={statusVariant(candidate.status)}>
                    {statusLabel[candidate.status]}
                  </Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/app/candidates/${candidate.id}`}>Full View</Link>
                  </Button>
                </>
              )}
              <SheetCloseButton />
            </div>
          </div>
        </SheetHeader>

        {/* ── Body ────────────────────────────────── */}
        {!candidate || !job ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            Candidate not found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Feedback banner */}
            {feedback && (
              <div
                className={cn(
                  "mx-6 mt-4 rounded-md px-4 py-2 text-sm",
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {feedback.text}
              </div>
            )}

            <div className="space-y-5 px-6 pb-8 pt-5">
              {/* ── Profile ─ */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Profile
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Job Applied
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{job.title}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Current Stage
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {currentStage?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Applied On
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatDateTime(candidate.appliedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {formatDateTime(candidate.updatedAt)}
                    </p>
                  </div>
                </div>
                {candidate.experienceSummary && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Experience
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-foreground">
                      {candidate.experienceSummary}
                    </p>
                  </div>
                )}
                {candidate.profileKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {candidate.profileKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {/* ── AI Evaluation ─ */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  AI Evaluation
                </h3>
                <div className="rounded-xl border border-border bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold text-indigo-700">
                      {candidate.aiEvaluation.overallScore}%
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Overall Score
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {candidate.aiEvaluation.summary}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ScorePill
                    label="ATS"
                    value={candidate.aiEvaluation.atsScore}
                    colorClass="border-sky-200 bg-sky-50 text-sky-800"
                  />
                  <ScorePill
                    label="Coding"
                    value={candidate.aiEvaluation.codingScore}
                    colorClass="border-violet-200 bg-violet-50 text-violet-800"
                  />
                  <ScorePill
                    label="Comms"
                    value={candidate.aiEvaluation.communicationScore}
                    colorClass="border-amber-200 bg-amber-50 text-amber-800"
                  />
                  <ScorePill
                    label="Domain"
                    value={candidate.aiEvaluation.domainScore}
                    colorClass="border-emerald-200 bg-emerald-50 text-emerald-800"
                  />
                </div>
              </section>

              {/* ── Status Actions ─ */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Status &amp; Stage
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-foreground">Move To Stage</p>
                    <Select
                      value={candidate.currentStageId}
                      onValueChange={(value) => {
                        moveCandidateStage(candidate.id, value);
                        flash("success", "Stage updated");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {job.workflowStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const result = advanceCandidateStage(candidate.id);
                        if (!result.ok) {
                          flash("error", result.reason ?? "Unable to advance");
                        } else {
                          flash("success", "Advanced to next stage");
                        }
                      }}
                    >
                      Next Stage
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatus("active", "Candidate reactivated from the Kanban board.")
                      }
                    >
                      Re-activate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() =>
                        handleStatus("hold", "Placed on hold from the Kanban board.")
                      }
                    >
                      Hold
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleStatus("rejected", "Rejected from the Kanban board.")
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="col-span-2 bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() =>
                        handleStatus("selected", "Candidate marked as selected from the Kanban board.")
                      }
                    >
                      Mark Selected
                    </Button>
                  </div>
                </div>
              </section>

              {/* ── Notes ─ */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </h3>
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Add a note..."
                  />
                  <Button size="sm" variant="outline" onClick={handleAddNote}>
                    Save Note
                  </Button>
                  {candidate.notes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {candidate.notes.slice(0, 3).map((note) => (
                        <div
                          key={note.id}
                          className="rounded-md border border-border bg-muted/30 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold capitalize text-foreground">
                              {note.author}
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{note.text}</p>
                        </div>
                      ))}
                      {candidate.notes.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{candidate.notes.length - 3} more notes in Full View
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* ── Timeline ─ */}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recent Activity
                </h3>
                {candidate.timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {candidate.timeline.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md border border-border bg-muted/30 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{event.label}</p>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDateTime(event.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
                      </div>
                    ))}
                    {candidate.timeline.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{candidate.timeline.length - 5} more events in Full View
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
