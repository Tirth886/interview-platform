import { type ChangeEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import type { Interview, InterviewRoundType } from "../../../services/interviews";
import { formatDateTimeDisplay } from "../../../utils/dateUtils";
import type { DialogMode, InterviewFormData } from "../../../types/interviews";

type CandidateLike = {
  id: string;
  name: string;
};

type InterviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogMode: DialogMode | null;
  selectedInterview: Interview | null;
  formData: InterviewFormData;
  onFormChange: (next: InterviewFormData) => void;
  candidates: CandidateLike[];
  candidateMap: Map<string, CandidateLike>;
  error: string | null;
  message: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onConfirmCancel: () => void;
};

export const InterviewDialog = ({
  open,
  onOpenChange,
  dialogMode,
  selectedInterview,
  formData,
  onFormChange,
  candidates,
  candidateMap,
  error,
  message,
  isPending,
  onSubmit,
  onConfirmCancel,
}: InterviewDialogProps): JSX.Element => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {dialogMode === "create"
              ? "Schedule Interview"
              : dialogMode === "reschedule"
                ? "Reschedule Interview"
                : "Cancel Interview"}
          </DialogTitle>
          {dialogMode !== "cancel" ? (
            <DialogDescription>
              {dialogMode === "create"
                ? "Create a new interview session"
                : "Adjust interview timing"}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {dialogMode === "cancel" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel this interview?
            </p>
            {selectedInterview ? (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <p className="font-medium">
                  {candidateMap.get(selectedInterview.candidateId)?.name ?? "Candidate"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTimeDisplay(selectedInterview.startAt)}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {error ? (
              <div className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {dialogMode === "create" ? (
              <Select
                value={formData.candidateId}
                onValueChange={(value) => onFormChange({ ...formData, candidateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {dialogMode === "create" ? (
              <Select
                value={formData.roundType}
                onValueChange={(value: InterviewRoundType) =>
                  onFormChange({ ...formData, roundType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select round type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai-interview">AI Interview</SelectItem>
                  <SelectItem value="coding">Coding Interview</SelectItem>
                  <SelectItem value="human-interview">Human Interview</SelectItem>
                  <SelectItem value="qa-evaluation">Q&A Evaluation</SelectItem>
                </SelectContent>
              </Select>
            ) : null}

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Start Date & Time
              </label>
              <Input
                type="datetime-local"
                value={formData.startAtLocal}
                onChange={(event) =>
                  onFormChange({ ...formData, startAtLocal: event.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Duration (minutes)
              </label>
              <Input
                type="number"
                min="15"
                max="360"
                value={formData.durationMinutes}
                onChange={(event) =>
                  onFormChange({ ...formData, durationMinutes: event.target.value })
                }
              />
            </div>

            {dialogMode === "create" ? (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    onFormChange({ ...formData, instructions: event.target.value })
                  }
                  placeholder="Interview instructions, topics, etc."
                  className="mt-1 min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {dialogMode === "cancel" ? "Keep Interview" : "Cancel"}
          </Button>
          <Button
            onClick={() => {
              if (dialogMode === "cancel") {
                onConfirmCancel();
                return;
              }
              onSubmit();
            }}
            disabled={isPending}
          >
            {isPending
              ? "Processing..."
              : dialogMode === "create"
                ? "Schedule"
                : dialogMode === "reschedule"
                  ? "Reschedule"
                  : "Confirm Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
