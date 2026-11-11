import { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
import type { AiAgentConfig, AiAgentForm } from "../../../types/settings";
import { blankAiAgentForm } from "../../../constants/settings";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { formatDateTime } from "../../../utils/dateUtils";
import { ConfirmDialog } from "../../../components/ConfirmDialog";

export const AiAgentManager = ({
  canEdit,
  title = "AI Agents",
  description = "Reusable AI agent contexts and rules.",
}: {
  canEdit: boolean;
  title?: string;
  description?: string;
}): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const aiAgents = useSettingsStore((state) => state.aiAgents ?? []);
  const aiAgentsHydrated = useSettingsStore((state) => state.aiAgentsHydrated);
  const hydrateAiAgents = useSettingsStore((state) => state.hydrateAiAgents);
  const addAiAgent = useSettingsStore((state) => state.addAiAgent);
  const updateAiAgent = useSettingsStore((state) => state.updateAiAgent);
  const deleteAiAgent = useSettingsStore((state) => state.deleteAiAgent);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AiAgentForm>(blankAiAgentForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AiAgentConfig | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    void hydrateAiAgents(session.token).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load AI agents.");
    });
  }, [session?.token, hydrateAiAgents]);

  const openCreate = (): void => {
    setEditingId(null);
    setForm(blankAiAgentForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (agent: AiAgentConfig): void => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      contextMarkdown: agent.contextMarkdown,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const saveAgent = async (): Promise<void> => {
    if (!session?.token) {
      setFormError("You must be signed in to save an AI agent.");
      return;
    }
    setBusy(true);
    const result = editingId
      ? await updateAiAgent(editingId, form, session.token)
      : await addAiAgent(form, session.token);
    setBusy(false);
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to save AI agent");
      return;
    }
    setDialogOpen(false);
    setEditingId(null);
    setForm(blankAiAgentForm);
    setFormError(null);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!pendingDelete || !session?.token) {
      setLoadError("You must be signed in to delete an AI agent.");
      setPendingDelete(null);
      return;
    }
    setBusy(true);
    const result = await deleteAiAgent(pendingDelete.id, session.token);
    setBusy(false);
    setPendingDelete(null);
    if (!result.ok) {
      setLoadError(result.reason ?? "Unable to delete AI agent");
      return;
    }
    setLoadError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button disabled={!canEdit || busy} onClick={openCreate}>
          Create Agent
        </Button>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

      {!aiAgentsHydrated && !loadError ? (
        <p className="text-sm text-muted-foreground">Loading AI agents…</p>
      ) : aiAgents.length === 0 ? (
        <div className="px-1 py-10 text-center text-sm text-muted-foreground">
          No AI agents yet. Click Create Agent to get started.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {aiAgents.length} agent(s) in your company.
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aiAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                    <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                      <span className="line-clamp-2 whitespace-pre-wrap">
                        {agent.contextMarkdown?.trim() || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {agent.updatedAt ? formatDateTime(agent.updatedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="Open actions"
                            disabled={busy}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            disabled={!canEdit}
                            onClick={() => openEdit(agent)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canEdit}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setPendingDelete(agent)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setForm(blankAiAgentForm);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit AI Agent" : "Create AI Agent"}</DialogTitle>
            <DialogDescription>
              Give the agent a name and Markdown context used during interviews.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Resume Screener Agent"
                disabled={busy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="agent-context">Context (Markdown)</Label>
              <textarea
                id="agent-context"
                value={form.contextMarkdown}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contextMarkdown: event.target.value }))
                }
                placeholder="Describe how this agent should behave…"
                disabled={busy}
                className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || !form.name.trim()}
              onClick={() => void saveAgent()}
            >
              {editingId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete AI agent?"
        description={
          pendingDelete
            ? `Are you sure you want to delete "${pendingDelete.name}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Yes"
        cancelLabel="No"
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};
