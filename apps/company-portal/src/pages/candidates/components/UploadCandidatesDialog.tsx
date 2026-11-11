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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import {
  resumeAcceptAttribute,
  resumeUploadConfig,
  resumeUploadConfigLabel,
} from "../../../constants/candidates";

type WorkflowOption = {
  id: string;
  name: string;
};

type UploadCandidatesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflows: WorkflowOption[];
  onUpload: (payload: {
    workflowId: string;
    batchName: string;
    files: File[];
  }) => Promise<{ ok: boolean; reason?: string }>;
};

const validateResumeFiles = (files: File[]): string | null => {
  if (files.length === 0) {
    return "Select at least one resume file.";
  }
  if (files.length > resumeUploadConfig.maxFiles) {
    return `You can upload at most ${resumeUploadConfig.maxFiles} resumes at once.`;
  }

  const maxBytes = resumeUploadConfig.maxFileSizeMb * 1024 * 1024;
  for (const file of files) {
    if (file.size <= 0) {
      return `Resume "${file.name}" is empty.`;
    }
    if (file.size > maxBytes) {
      return `Resume "${file.name}" must be ${resumeUploadConfig.maxFileSizeMb} MB or smaller.`;
    }
    const lower = file.name.toLowerCase();
    const ok = resumeUploadConfig.allowedExtensions.some((ext) => lower.endsWith(ext));
    if (!ok) {
      return `Resume "${file.name}" type is not allowed. Use: ${resumeUploadConfig.allowedExtensions.join(", ")}`;
    }
  }

  return null;
};

export const UploadCandidatesDialog = ({
  open,
  onOpenChange,
  workflows,
  onUpload,
}: UploadCandidatesDialogProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [workflowId, setWorkflowId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = (): void => {
    setWorkflowId("");
    setBatchName("");
    setFiles([]);
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
    if (!workflowId) {
      setError("Select a hiring workflow.");
      return;
    }

    const trimmedBatchName = batchName.trim();
    if (!trimmedBatchName) {
      setError("Enter a batch name.");
      return;
    }

    const fileError = validateResumeFiles(files);
    if (fileError) {
      setError(fileError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onUpload({
        workflowId,
        batchName: trimmedBatchName,
        files,
      });
      if (!result.ok) {
        setError(result.reason ?? "Unable to upload candidates.");
        setIsSubmitting(false);
        return;
      }
      reset();
      onOpenChange(false);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to upload candidates."
      );
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    Boolean(workflowId) &&
    batchName.trim().length > 0 &&
    files.length > 0 &&
    !isSubmitting &&
    workflows.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Candidates</DialogTitle>
          <DialogDescription>
            Name this upload batch, choose a hiring workflow, then upload resumes.{" "}
            {resumeUploadConfigLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch name</Label>
            <Input
              id="batch-name"
              value={batchName}
              placeholder="e.g. Frontend March 2026"
              disabled={isSubmitting}
              onChange={(event) => {
                setBatchName(event.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Hiring workflow</Label>
            {workflows.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
                No workflows yet. Create one under Settings → Hiring Workflow first.
              </p>
            ) : (
              <Select
                value={workflowId || undefined}
                onValueChange={(value) => {
                  setWorkflowId(value);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-files">Resumes</Label>
            <Input
              id="resume-files"
              ref={fileInputRef}
              type="file"
              multiple
              accept={resumeAcceptAttribute}
              disabled={isSubmitting || workflows.length === 0}
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setFiles(nextFiles);
                setError(validateResumeFiles(nextFiles));
              }}
            />
            {files.length > 0 ? (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                {files.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="truncate">
                    {file.name} ({Math.ceil(file.size / 1024)} KB)
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No files selected.</p>
            )}
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
            {isSubmitting ? "Uploading…" : "Create candidates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
