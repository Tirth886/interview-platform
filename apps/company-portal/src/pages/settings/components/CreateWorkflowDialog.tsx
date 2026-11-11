import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@shared/ui";
import { validateJobDescriptionFile } from "../../../services/uploads";

type CreateWorkflowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    name: string;
    file: File;
  }) => Promise<{ ok: boolean; reason?: string }>;
};

export const CreateWorkflowDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateWorkflowDialogProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = (): void => {
    setName("");
    setFile(null);
    setError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workflow name is required.");
      return;
    }

    const fileError = validateJobDescriptionFile(file);
    if (fileError || !file) {
      setError(fileError ?? "Job description file is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onCreate({
        name: trimmed,
        file,
      });

      if (!result.ok) {
        setError(result.reason ?? "Unable to create workflow.");
        setIsSubmitting(false);
        return;
      }

      reset();
      onOpenChange(false);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to create workflow.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  const canSubmit = Boolean(name.trim() && file && !isSubmitting);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Name this hiring workflow and upload a job description file to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow name</Label>
            <Input
              id="workflow-name"
              value={name}
              autoFocus
              placeholder="e.g. Backend Engineer Hiring"
              disabled={isSubmitting}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">Job description</Label>
            <Input
              id="job-description"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              disabled={isSubmitting}
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                const fileError = validateJobDescriptionFile(nextFile);
                setFile(nextFile);
                setError(fileError);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Required. PDF, DOC, DOCX, or TXT · max 10 MB
            </p>
            {file ? (
              <p className="truncate text-sm text-foreground">Selected: {file.name}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {isSubmitting ? "Uploading…" : "Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
