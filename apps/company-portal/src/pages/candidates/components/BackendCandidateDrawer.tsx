import { useState } from "react";
import {
  Badge,
  Button,
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui";
import type { Candidate, CandidateStatus } from "../../../services/candidates";

type BackendCandidateDrawerProps = {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeStatus: (candidateId: string, status: CandidateStatus) => void;
  onAddNote: (candidateId: string, text: string) => void;
  onRunAutomation: (candidateId: string) => void;
  statusUpdating: boolean;
  noteSubmitting: boolean;
  automationRunning: boolean;
};

const badgeVariant = (
  status: CandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") return "success";
  if (status === "hold") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const fmt = (value: string): string => value.replace("T", " ").slice(0, 16);

export function BackendCandidateDrawer({
  candidate,
  open,
  onOpenChange,
  onChangeStatus,
  onAddNote,
  onRunAutomation,
  statusUpdating,
  noteSubmitting,
  automationRunning,
}: BackendCandidateDrawerProps): JSX.Element {
  const [noteText, setNoteText] = useState("");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{candidate?.name ?? 'Candidate'}</SheetTitle>
              {candidate ? (
                <SheetDescription className="mt-0.5 truncate">{candidate.email}</SheetDescription>
              ) : null}
            </div>
            {candidate ? <Badge variant={badgeVariant(candidate.status)}>{candidate.status}</Badge> : null}
            <SheetCloseButton />
          </div>
        </SheetHeader>

        {!candidate ? (
          <div className="p-6 text-sm text-muted-foreground">Candidate not found.</div>
        ) : (
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p><span className="font-medium">Phone:</span> {candidate.phoneNumber ?? 'Not provided'}</p>
              <p><span className="font-medium">Applied:</span> {fmt(candidate.appliedAt)}</p>
              <p><span className="font-medium">Updated:</span> {fmt(candidate.updatedAt)}</p>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
              <p className="mt-1 text-sm text-foreground">{candidate.experienceSummary}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={statusUpdating}
                onClick={() => onChangeStatus(candidate.id, 'active')}
              >
                Mark Active
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={statusUpdating}
                onClick={() => onChangeStatus(candidate.id, 'hold')}
              >
                Hold
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={statusUpdating}
                onClick={() => onChangeStatus(candidate.id, 'rejected')}
              >
                Reject
              </Button>
              <Button
                type="button"
                disabled={statusUpdating}
                onClick={() => onChangeStatus(candidate.id, 'selected')}
              >
                Select
              </Button>
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={automationRunning}
                onClick={() => onRunAutomation(candidate.id)}
                className="w-full"
              >
                {automationRunning ? 'Running automation...' : 'Run Automation'}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Notes
              </p>
              <div className="mb-3 space-y-2">
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Add recruiter note"
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  disabled={noteSubmitting || noteText.trim().length === 0}
                  onClick={() => {
                    onAddNote(candidate.id, noteText.trim());
                    setNoteText('');
                  }}
                >
                  {noteSubmitting ? 'Adding note...' : 'Add Note'}
                </Button>
              </div>
              {candidate.notes.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  No notes yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidate.notes.map((note) => (
                    <div key={note.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="text-foreground">{note.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {note.author} · {fmt(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Timeline
              </p>
              {candidate.timeline.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                  No timeline events yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {candidate.timeline.map((event) => (
                    <div key={event.id} className="rounded-md border border-border p-3 text-sm">
                      <p className="font-medium text-foreground">{event.label}</p>
                      <p className="text-muted-foreground">{event.detail}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{fmt(event.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
