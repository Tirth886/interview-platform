import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
};

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Yes",
  cancelLabel = "No",
  busy = false,
  onConfirm,
}: ConfirmDialogProps): JSX.Element => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => onOpenChange(false)}
        >
          {cancelLabel}
        </Button>
        <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
