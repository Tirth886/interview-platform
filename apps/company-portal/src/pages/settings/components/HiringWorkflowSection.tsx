import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import {
  Button,
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
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { uploadJobDescription } from "../../../services/uploads";
import { formatDateTime } from "../../../utils/dateUtils";
import type { HiringWorkflow } from "../../../types/settings";
import { ConfirmDialog } from "../../../components/ConfirmDialog";
import { CreateWorkflowDialog } from "./CreateWorkflowDialog";

type HiringWorkflowSectionProps = {
  canEdit: boolean;
  title?: string;
  description?: string;
};

export const HiringWorkflowSection = ({
  canEdit,
  title = "Hiring Workflow",
  description = "Create named workflows and design stage flowcharts.",
}: HiringWorkflowSectionProps): JSX.Element => {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const workflows = useSettingsStore((state) => state.workflows);
  const workflowsHydrated = useSettingsStore((state) => state.workflowsHydrated);
  const hydrateStagesAndWorkflows = useSettingsStore((state) => state.hydrateStagesAndWorkflows);
  const createWorkflow = useSettingsStore((state) => state.createWorkflow);
  const deleteWorkflow = useSettingsStore((state) => state.deleteWorkflow);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HiringWorkflow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    let cancelled = false;
    void hydrateStagesAndWorkflows(session.token).catch((error: unknown) => {
      if (cancelled) return;
      setLoadError(error instanceof Error ? error.message : "Unable to load workflows.");
    });
    return () => {
      cancelled = true;
    };
  }, [session?.token, hydrateStagesAndWorkflows]);

  const confirmDelete = async (): Promise<void> => {
    if (!pendingDelete) return;
    if (!session?.token) {
      setActionError("You must be signed in to delete a workflow.");
      setPendingDelete(null);
      return;
    }
    setBusy(true);
    const result = await deleteWorkflow(pendingDelete.id, session.token);
    setBusy(false);
    setPendingDelete(null);
    if (!result.ok) {
      setActionError(result.reason ?? "Unable to delete workflow.");
      return;
    }
    setActionError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button disabled={!canEdit} onClick={() => setIsCreateOpen(true)}>
          Create Workflow
        </Button>
      </div>

      {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
      {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

      {!workflowsHydrated && !loadError ? (
        <p className="text-sm text-muted-foreground">Loading workflows…</p>
      ) : workflows.length === 0 ? (
        <div className="px-1 py-10 text-center text-sm text-muted-foreground">
          No workflows yet. Click Create Workflow to get started.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {workflows.length} workflow(s) in your company.
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job description</TableHead>
                  <TableHead>Nodes</TableHead>
                  <TableHead>Connections</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium text-foreground">{workflow.name}</TableCell>
                    <TableCell className="max-w-[240px] text-sm text-muted-foreground">
                      <span className="line-clamp-1">
                        {workflow.jobDescriptionFileName || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {workflow.nodes.length}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {workflow.edges.length}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {workflow.updatedAt ? formatDateTime(workflow.updatedAt) : "—"}
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/app/master/hiring-workflow/${workflow.id}`)
                            }
                          >
                            {canEdit ? "Open" : "View"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!workflow.jobDescriptionUrl}
                            onClick={() => {
                              if (!workflow.jobDescriptionUrl) return;
                              window.open(
                                workflow.jobDescriptionUrl,
                                "_blank",
                                "noopener,noreferrer"
                              );
                            }}
                          >
                            View job description
                          </DropdownMenuItem>
                          {canEdit ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setPendingDelete(workflow)}
                            >
                              Delete
                            </DropdownMenuItem>
                          ) : null}
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

      <CreateWorkflowDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={async ({ name, file }) => {
          if (!session?.token) {
            return { ok: false, reason: "You must be signed in to upload a job description." };
          }

          try {
            const uploaded = await uploadJobDescription(file, session.token);
            const result = await createWorkflow(
              {
                name,
                jobDescriptionFileName: uploaded.fileName,
                jobDescriptionUrl: uploaded.url,
                jobDescriptionKey: uploaded.key,
              },
              session.token
            );

            if (result.ok && result.workflow) {
              navigate(`/app/master/hiring-workflow/${result.workflow.id}`);
            }

            return result;
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "Failed to upload job description.";
            return { ok: false, reason: message };
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete workflow?"
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
