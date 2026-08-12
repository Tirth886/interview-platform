import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BackendCandidateDrawer } from "./components/BackendCandidateDrawer";
import { CandidateMetrics } from "./components/CandidateMetrics";
import { CandidateBoardControls } from "./components/CandidateBoardControls";
import { CandidateCreateForm } from "./components/CandidateCreateForm";
import { CandidateBoardLane } from "./components/CandidateBoardLane";
import {
  addCandidateNote,
  createCandidate,
  listCandidates,
  runCandidateAutomation,
  type Candidate,
  type CandidateStatus,
  updateCandidateStatus,
} from "../../services/candidates";
import { useAuthStore } from "../../stores/useAuthStore";

type AtsFilter = "all" | "pass" | "fail";
type BoardLaneId = "pending" | "hold" | "rejected" | "approved";

const ATS_PASS_SCORE = 70;

const statusVariant = (
  status: CandidateStatus
): "success" | "warning" | "destructive" | "secondary" => {
  if (status === "selected") return "success";
  if (status === "hold") return "warning";
  if (status === "rejected") return "destructive";
  return "secondary";
};

const laneMeta: Record<
  BoardLaneId,
  {
    title: string;
    description: string;
    shellClassName: string;
    headerClassName: string;
    countClassName: string;
    dropStatus: CandidateStatus;
  }
> = {
  pending: {
    title: "ATS In Process",
    description: "Candidate just applied. ATS processing is in progress.",
    shellClassName: "border-violet-200 bg-violet-50/70",
    headerClassName: "bg-violet-100 text-violet-900 border-violet-200",
    countClassName: "text-violet-700",
    dropStatus: "pending",
  },
  hold: {
    title: "Hold",
    description: "Needs manual intervention before moving ahead.",
    shellClassName: "border-amber-200 bg-amber-50/70",
    headerClassName: "bg-amber-100 text-amber-900 border-amber-200",
    countClassName: "text-amber-700",
    dropStatus: "hold",
  },
  rejected: {
    title: "Rejected",
    description: "Rejected candidates are closed in the pipeline.",
    shellClassName: "border-rose-200 bg-rose-50/70",
    headerClassName: "bg-rose-100 text-rose-900 border-rose-200",
    countClassName: "text-rose-700",
    dropStatus: "rejected",
  },
  approved: {
    title: "Approved",
    description: "Active and selected candidates ready for next actions.",
    shellClassName: "border-emerald-200 bg-emerald-50/70",
    headerClassName: "bg-emerald-100 text-emerald-900 border-emerald-200",
    countClassName: "text-emerald-700",
    dropStatus: "selected",
  },
};

const getAtsResult = (score: number): "pass" | "fail" =>
  score >= ATS_PASS_SCORE ? "pass" : "fail";

const getLane = (status: CandidateStatus): BoardLaneId => {
  if (status === "pending") return "pending";
  if (status === "hold") return "hold";
  if (status === "rejected") return "rejected";
  return "approved";
};

export default function CandidatesPage(): JSX.Element {
  const session = useAuthStore((state) => state.session);

  const [search, setSearch] = useState("");
  const [atsFilter, setAtsFilter] = useState<AtsFilter>("all");
  const [createPhoneNumber, setCreatePhoneNumber] = useState("");
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [drawerCandidateId, setDrawerCandidateId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [dragCandidateId, setDragCandidateId] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<BoardLaneId | null>(null);

  const backendCandidatesQuery = useQuery({
    queryKey: ["backend-candidates", session?.token],
    queryFn: () => {
      if (!session?.token) {
        return Promise.resolve([]);
      }
      return listCandidates(session.token);
    },
    enabled: Boolean(session?.token),
  });

  const candidates = backendCandidatesQuery.data ?? [];

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (!query) return true;
      return (
        candidate.name.toLowerCase().includes(query) ||
        candidate.email.toLowerCase().includes(query) ||
        (candidate.phoneNumber ?? "").toLowerCase().includes(query)
      );
    });
  }, [candidates, search]);

  const boardGroups = useMemo(() => {
    const columns: Record<BoardLaneId, Candidate[]> = {
      pending: [],
      hold: [],
      rejected: [],
      approved: [],
    };

    filteredCandidates.forEach((candidate) => {
      const lane = getLane(candidate.status);

      if (lane === "approved" && atsFilter !== "all") {
        const atsResult = getAtsResult(candidate.aiEvaluation.atsScore);
        if (atsResult !== atsFilter) return;
      }

      columns[lane].push(candidate);
    });

    (Object.keys(columns) as BoardLaneId[]).forEach((lane) => {
      columns[lane].sort(
        (a, b) => b.aiEvaluation.overallScore - a.aiEvaluation.overallScore
      );
    });

    return columns;
  }, [atsFilter, filteredCandidates]);

  const visibleCount = Object.values(boardGroups).reduce(
    (total, items) => total + items.length,
    0
  );

  const averageScore =
    filteredCandidates.length === 0
      ? 0
      : Math.round(
          filteredCandidates.reduce(
            (total, candidate) => total + candidate.aiEvaluation.overallScore,
            0
          ) / filteredCandidates.length
        );

  const updateBackendStatusMutation = useMutation({
    mutationFn: ({ candidateId, status }: { candidateId: string; status: CandidateStatus }) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }

      return updateCandidateStatus(
        candidateId,
        {
          status,
          detail: `Status updated from candidates board to ${status}.`,
        },
        session.token
      );
    },
    onSuccess: () => {
      void backendCandidatesQuery.refetch();
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update candidate status right now."
      );
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: (payload: { phoneNumber: string; name?: string; email?: string }) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }

      return createCandidate(payload, session.token);
    },
    onSuccess: () => {
      void backendCandidatesQuery.refetch();
      setError(null);
      setMessage("Candidate created successfully.");
      setCreatePhoneNumber("");
      setCreateName("");
      setCreateEmail("");
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to create candidate."
      );
    },
  });

  const addBackendNoteMutation = useMutation({
    mutationFn: ({ candidateId, text }: { candidateId: string; text: string }) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }

      return addCandidateNote(
        candidateId,
        {
          text,
          author: session.user.role,
        },
        session.token
      );
    },
    onSuccess: () => {
      void backendCandidatesQuery.refetch();
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to add note right now."
      );
    },
  });

  const runBackendAutomationMutation = useMutation({
    mutationFn: ({ candidateId }: { candidateId: string }) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }

      return runCandidateAutomation(candidateId, session.token);
    },
    onSuccess: () => {
      void backendCandidatesQuery.refetch();
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to run automation right now."
      );
    },
  });

  const selectedBackendCandidate = useMemo<Candidate | null>(() => {
    if (!drawerCandidateId || !backendCandidatesQuery.data) {
      return null;
    }

    return (
      backendCandidatesQuery.data.find((candidate) => candidate.id === drawerCandidateId) ?? null
    );
  }, [backendCandidatesQuery.data, drawerCandidateId]);

  const handleCreateCandidate = (): void => {
    setMessage(null);
    setError(null);

    const phoneNumber = createPhoneNumber.trim();
    if (!phoneNumber) {
      setError("Phone number is required.");
      return;
    }

    createCandidateMutation.mutate({
      phoneNumber,
      name: createName.trim() || undefined,
      email: createEmail.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted-foreground">
            Fully backend-driven candidate board with status, notes, and automation actions.
          </p>
        </div>
      </div>

      <CandidateMetrics visibleCount={visibleCount} averageScore={averageScore} />

      <CandidateBoardControls search={search} onSearchChange={setSearch} />

      <CandidateCreateForm
        phoneNumber={createPhoneNumber}
        onPhoneNumberChange={setCreatePhoneNumber}
        name={createName}
        onNameChange={setCreateName}
        email={createEmail}
        onEmailChange={setCreateEmail}
        error={error}
        message={message}
        queryError={backendCandidatesQuery.isError}
        queryErrorMessage={
          backendCandidatesQuery.error instanceof Error
            ? backendCandidatesQuery.error.message
            : "Unable to load candidates."
        }
        isLoading={createCandidateMutation.isPending}
        onSubmit={handleCreateCandidate}
      />

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1200px] gap-4 xl:grid-cols-4">
          {(["pending", "hold", "rejected", "approved"] as BoardLaneId[]).map((laneId) => {
            const meta = laneMeta[laneId];
            const items = boardGroups[laneId];
            const isDropTarget = dragOverLane === laneId && dragCandidateId !== null;

            return (
              <CandidateBoardLane
                key={laneId}
                laneId={laneId}
                laneMeta={meta}
                candidates={items}
                isLoading={backendCandidatesQuery.isLoading}
                isDropTarget={isDropTarget}
                dragCandidateId={dragCandidateId}
                atsFilter={atsFilter}
                onAtsFilterChange={setAtsFilter}
                onDragStart={(candidateId) => {
                  setDragCandidateId(candidateId);
                }}
                onDragEnd={() => {
                  setDragCandidateId(null);
                  setDragOverLane(null);
                }}
                onDrop={(e, laneId) => {
                  e.preventDefault();
                  const candidateId = e.dataTransfer.getData("candidateId");
                  if (!candidateId) return;

                  const targetStatus = laneMeta[laneId].dropStatus;
                  const candidate = candidates.find((item) => item.id === candidateId);

                  if (candidate && candidate.status !== targetStatus) {
                    updateBackendStatusMutation.mutate({
                      candidateId,
                      status: targetStatus,
                    });
                  }

                  setDragCandidateId(null);
                  setDragOverLane(null);
                }}
                onCandidateClick={(candidateId) => {
                  setDrawerCandidateId(candidateId);
                  setDrawerOpen(true);
                }}
                statusVariant={statusVariant}
                onDragOverLane={() => setDragOverLane(laneId)}
                onDragLeaveLane={() => setDragOverLane(null)}
              />
            );
          })}
        </div>
      </div>

      <BackendCandidateDrawer
        candidate={selectedBackendCandidate}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onChangeStatus={(candidateId, status) => {
          updateBackendStatusMutation.mutate({ candidateId, status });
        }}
        onAddNote={(candidateId, text) => {
          addBackendNoteMutation.mutate({ candidateId, text });
        }}
        onRunAutomation={(candidateId) => {
          runBackendAutomationMutation.mutate({ candidateId });
        }}
        statusUpdating={updateBackendStatusMutation.isPending}
        noteSubmitting={addBackendNoteMutation.isPending}
        automationRunning={runBackendAutomationMutation.isPending}
      />
    </div>
  );
}
