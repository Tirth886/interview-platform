import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";
import {
  batchCreateCandidates,
  listCandidates,
  requestCandidateParse,
  updateCandidateStage,
  type Candidate,
  type CandidateStatus,
} from "../../services/candidates";
import { uploadResumes } from "../../services/uploads";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import {
  getInitialWorkflowStageId,
  getWorkflowStageOptions,
} from "../../utils/workflowStages";
import { CandidateRowActions } from "./components/CandidateRowActions";
import { UploadCandidatesDialog } from "./components/UploadCandidatesDialog";

const SKILL_CHIP_COLORS = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-900",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-cyan-100 text-cyan-800",
  "bg-orange-100 text-orange-900",
  "bg-teal-100 text-teal-800",
] as const;

const isPendingParse = (candidate: Candidate): boolean =>
  candidate.name === "Pending parse" ||
  candidate.experienceSummary.toLowerCase().includes("pending parsing");

const skillChipClass = (keyword: string, index: number): string => {
  let hash = 0;
  for (let i = 0; i < keyword.length; i += 1) {
    hash = (hash + keyword.charCodeAt(i) * (i + 1)) % SKILL_CHIP_COLORS.length;
  }
  return SKILL_CHIP_COLORS[(hash + index) % SKILL_CHIP_COLORS.length];
};

const statusVariant = (
  status: CandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") return "success";
  if (status === "hold") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

export default function CandidatesPage(): JSX.Element {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const workflows = useSettingsStore((state) => state.workflows);
  const hydrateWorkflows = useSettingsStore((state) => state.hydrateWorkflows);

  useEffect(() => {
    if (!session?.token) return;
    void hydrateWorkflows(session.token);
  }, [session?.token, hydrateWorkflows]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [parsingIds, setParsingIds] = useState<Set<string>>(new Set());

  const candidatesQuery = useQuery({
    queryKey: ["backend-candidates", session?.token],
    queryFn: () => {
      if (!session?.token) {
        return Promise.resolve([]);
      }
      return listCandidates(session.token);
    },
    enabled: Boolean(session?.token),
    refetchInterval: (query) => {
      const items = query.state.data ?? [];
      return items.some(isPendingParse) ? 5000 : false;
    },
  });

  const workflowById = useMemo(
    () => new Map(workflows.map((workflow) => [workflow.id, workflow])),
    [workflows]
  );

  const candidates = candidatesQuery.data ?? [];

  const handleManualParse = async (candidateId: string): Promise<void> => {
    if (!session?.token) {
      setMessage("You must be signed in to parse resumes.");
      return;
    }

    setParsingIds((prev) => new Set(prev).add(candidateId));
    try {
      await requestCandidateParse(candidateId, session.token);
      setMessage("Resume parse queued. Profile fields will update shortly.");
      void candidatesQuery.refetch();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to queue resume parse right now."
      );
    } finally {
      setParsingIds((prev) => {
        const next = new Set(prev);
        next.delete(candidateId);
        return next;
      });
    }
  };

  const handleMoveToStage = async (
    candidate: Candidate,
    stageId: string,
    stageLabel: string
  ): Promise<void> => {
    if (!session?.token) {
      setMessage("You must be signed in to move candidates.");
      return;
    }

    try {
      await updateCandidateStage(
        candidate.id,
        { stageId, detail: `Moved to stage "${stageLabel}".` },
        session.token
      );
      setMessage(`Moved ${candidate.name} to "${stageLabel}".`);
      void candidatesQuery.refetch();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update candidate stage right now."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Candidates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload resumes in named batches. Parsed name, title, and skills appear after ATS
            processing.
          </p>
        </div>
        <Button disabled={!session?.token} onClick={() => setIsUploadOpen(true)}>
          Upload Candidates
        </Button>
      </div>

      {message ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}

      {candidatesQuery.isError ? (
        <p className="text-sm text-destructive">
          {candidatesQuery.error instanceof Error
            ? candidatesQuery.error.message
            : "Unable to load candidates."}
        </p>
      ) : candidatesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading candidates…</p>
      ) : candidates.length === 0 ? (
        <div className="px-1 py-10 text-center text-sm text-muted-foreground">
          No candidates yet. Click Upload Candidates to get started.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {candidates.length} candidate(s) in your company.
          </p>
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => {
                  const pending = isPendingParse(candidate);
                  const workflow = candidate.workflowId
                    ? workflowById.get(candidate.workflowId)
                    : undefined;
                  const stages = getWorkflowStageOptions(workflow);
                  const isParsing = parsingIds.has(candidate.id);

                  return (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium text-foreground">
                        {candidate.name === "Pending parse" ? (
                          <span className="text-muted-foreground">Pending parse</span>
                        ) : (
                          candidate.name
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {candidate.currentJobTitle ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {pending || candidate.email.includes("@placeholder.local")
                          ? "—"
                          : candidate.email}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {candidate.phoneNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {candidate.batchName ?? "—"}
                      </TableCell>
                      <TableCell>
                        {candidate.profileKeywords.length > 0 ? (
                          <div className="flex max-w-[240px] flex-wrap gap-1">
                            {candidate.profileKeywords.slice(0, 5).map((keyword, index) => (
                              <span
                                key={`${candidate.id}-${keyword}`}
                                className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${skillChipClass(keyword, index)}`}
                              >
                                {keyword}
                              </span>
                            ))}
                            {candidate.profileKeywords.length > 5 ? (
                              <span className="text-[10px] text-muted-foreground">
                                +{candidate.profileKeywords.length - 5}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(candidate.status)} className="capitalize">
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <CandidateRowActions
                          hasResume={Boolean(candidate.resumeUrl)}
                          canParse={Boolean(candidate.resumeUrl)}
                          isParsing={isParsing}
                          stages={stages}
                          currentStageId={candidate.currentStageId}
                          onView={() => navigate(`/app/candidates/${candidate.id}`)}
                          onResume={() => {
                            if (candidate.resumeUrl) {
                              window.open(candidate.resumeUrl, "_blank", "noopener,noreferrer");
                            }
                          }}
                          onParse={() => void handleManualParse(candidate.id)}
                          onMoveToStage={(stageId, label) =>
                            void handleMoveToStage(candidate, stageId, label)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <UploadCandidatesDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        workflows={workflows}
        onUpload={async ({ workflowId, batchName, files }) => {
          if (!session?.token) {
            return { ok: false, reason: "You must be signed in to upload candidates." };
          }

          try {
            const workflow = workflowById.get(workflowId);
            const uploaded = await uploadResumes(files, session.token);
            const result = await batchCreateCandidates(
              {
                workflowId,
                batchName,
                initialStageId: getInitialWorkflowStageId(workflow),
                resumes: uploaded.map((item) => ({
                  key: item.key,
                  url: item.url,
                  fileName: item.fileName,
                })),
              },
              session.token
            );

            const failNote =
              result.failedCount > 0
                ? ` ${result.failedCount} failed${
                    result.failures?.length
                      ? `: ${result.failures.map((item) => item.fileName).join(", ")}`
                      : "."
                  }`
                : "";

            setMessage(
              `Created ${result.createdCount} candidate(s) in batch "${batchName}".${failNote}`
            );
            void candidatesQuery.refetch();
            return { ok: true };
          } catch (error: unknown) {
            return {
              ok: false,
              reason:
                error instanceof Error ? error.message : "Unable to upload candidates right now.",
            };
          }
        }}
      />
    </div>
  );
}
