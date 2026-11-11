import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "../../../stores/useAuthStore";
import { formatDateTime } from "../../../utils/dateUtils";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import {
  createQaBank,
  deleteQaBank,
  listQaBanks,
  updateQaBank,
  type QaBank,
} from "../../../services/qaBanks";

export const QaBankManager = ({
  canEdit,
  title = "Q&A",
  description = "Company question banks with options and correct answers.",
}: {
  canEdit: boolean;
  title?: string;
  description?: string;
}): JSX.Element => {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const [banks, setBanks] = useState<QaBank[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QaBank | null>(null);

  const refresh = async (): Promise<void> => {
    if (!session?.token) return;
    const items = await listQaBanks(session.token);
    setBanks(items);
    setHydrated(true);
  };

  useEffect(() => {
    if (!session?.token) return;
    void refresh().catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load Q&A banks.");
      setHydrated(true);
    });
  }, [session?.token]);

  const openCreate = (): void => {
    setEditingBankId(null);
    setBankName("");
    setNameError(null);
    setNameDialogOpen(true);
  };

  const openRename = (bank: QaBank): void => {
    setEditingBankId(bank.id);
    setBankName(bank.name);
    setNameError(null);
    setNameDialogOpen(true);
  };

  const openEditor = (bank: QaBank): void => {
    navigate(`/app/master/qa/${bank.id}`);
  };

  const saveName = async (): Promise<void> => {
    if (!session?.token) {
      setNameError("You must be signed in.");
      return;
    }
    const trimmed = bankName.trim();
    if (!trimmed) {
      setNameError("Q&A name is required.");
      return;
    }
    setBusy(true);
    try {
      if (editingBankId) {
        await updateQaBank(editingBankId, trimmed, session.token);
        setNameDialogOpen(false);
        await refresh();
      } else {
        const created = await createQaBank(trimmed, session.token);
        setNameDialogOpen(false);
        navigate(`/app/master/qa/${created.id}`);
      }
    } catch (error: unknown) {
      setNameError(error instanceof Error ? error.message : "Unable to save Q&A.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (!pendingDelete || !session?.token) {
      setPendingDelete(null);
      return;
    }
    setBusy(true);
    try {
      await deleteQaBank(pendingDelete.id, session.token);
      setPendingDelete(null);
      await refresh();
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "Unable to delete Q&A.");
      setPendingDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {canEdit ? (
          <Button type="button" size="sm" className="rounded-xl" onClick={openCreate}>
            Create Q&A
          </Button>
        ) : null}
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {!hydrated ? (
        <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Loading Q&A…
        </div>
      ) : banks.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          No Q&A banks yet. Create one to open the full question editor.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow
                  key={bank.id}
                  className="cursor-pointer"
                  onClick={() => openEditor(bank)}
                >
                  <TableCell className="font-medium">{bank.name}</TableCell>
                  <TableCell>{bank.questionCount}</TableCell>
                  <TableCell>{formatDateTime(bank.updatedAt)}</TableCell>
                  <TableCell onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditor(bank)}>
                          Edit questions
                        </DropdownMenuItem>
                        {canEdit ? (
                          <>
                            <DropdownMenuItem onClick={() => openRename(bank)}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-700"
                              onClick={() => setPendingDelete(bank)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={nameDialogOpen} onOpenChange={setNameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBankId ? "Rename Q&A" : "Create Q&A"}</DialogTitle>
            <DialogDescription>Give this question bank a clear name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="qa-name">Q&A name</Label>
            <Input
              id="qa-name"
              value={bankName}
              placeholder="e.g. DSA Fundamentals"
              onChange={(event) => {
                setBankName(event.target.value);
                setNameError(null);
              }}
            />
            {nameError ? <p className="text-sm text-destructive">{nameError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNameDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy || !canEdit} onClick={() => void saveName()}>
              {editingBankId ? "Save" : "Create & edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete Q&A?"
        description={`Delete "${pendingDelete?.name ?? ""}"? This soft-deletes the bank and its questions.`}
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};
