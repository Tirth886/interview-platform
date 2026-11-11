import { useEffect, useState } from "react";
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
import type { WorkflowNodeData } from "../../../types/settings";

type EditAtsCheckDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WorkflowNodeData | null;
  onSave: (label: string) => void;
  onDelete: () => void;
};

export const EditAtsCheckDialog = ({
  open,
  onOpenChange,
  initial,
  onSave,
  onDelete,
}: EditAtsCheckDialogProps): JSX.Element => {
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !initial) {
      return;
    }
    setLabel(initial.label ?? "ATS Check");
    setError(null);
  }, [open, initial]);

  const handleSave = (): void => {
    const clean = label.trim();
    if (!clean) {
      setError("Name is required.");
      return;
    }
    onSave(clean);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit ATS Check</DialogTitle>
          <DialogDescription>Name this resume / ATS screening step.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="ats-check-name">Name</Label>
          <Input
            id="ats-check-name"
            value={label}
            autoFocus
            placeholder="e.g. Resume ATS Screen"
            onChange={(event) => {
              setLabel(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSave();
              }
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            Remove
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
