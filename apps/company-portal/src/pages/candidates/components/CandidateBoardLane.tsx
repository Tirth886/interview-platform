import { type DragEvent } from "react";
import { Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, cn } from "@shared/ui";
import type { Candidate, CandidateStatus } from "../../../services/candidates";

type AtsFilter = "all" | "pass" | "fail";
type BoardLaneId = "pending" | "hold" | "rejected" | "approved";

const ATS_PASS_SCORE = 70;

interface LaneMeta {
  title: string;
  description: string;
  shellClassName: string;
  headerClassName: string;
  countClassName: string;
  dropStatus: CandidateStatus;
}

interface CandidateBoardLaneProps {
  laneId: BoardLaneId;
  laneMeta: LaneMeta;
  candidates: Candidate[];
  isLoading: boolean;
  isDropTarget: boolean;
  dragCandidateId: string | null;
  atsFilter: AtsFilter;
  onAtsFilterChange: (value: AtsFilter) => void;
  onDragStart: (candidateId: string) => void;
  onDragEnd: () => void;
  onDrop: (e: DragEvent<HTMLDivElement>, laneId: BoardLaneId) => void;
  onCandidateClick: (candidateId: string) => void;
  statusVariant: (status: CandidateStatus) => "success" | "warning" | "destructive" | "secondary";
  onDragOverLane: () => void;
  onDragLeaveLane: () => void;
}

const getAtsResult = (score: number): "pass" | "fail" =>
  score >= ATS_PASS_SCORE ? "pass" : "fail";

export function CandidateBoardLane({
  laneId,
  laneMeta,
  candidates,
  isLoading,
  isDropTarget,
  dragCandidateId,
  atsFilter,
  onAtsFilterChange,
  onDragStart,
  onDragEnd,
  onDrop,
  onCandidateClick,
  statusVariant,
  onDragOverLane,
  onDragLeaveLane,
}: CandidateBoardLaneProps): JSX.Element {
  const atsFilterOptions = [
    { value: "all" as const, label: "ATS: All" },
    { value: "pass" as const, label: "ATS: Pass" },
    { value: "fail" as const, label: "ATS: Fail" },
  ];

  return (
    <div
      className={cn(
        "flex h-[calc(100vh-280px)] min-h-[520px] flex-col rounded-2xl border p-3 shadow-sm transition-all duration-150",
        laneMeta.shellClassName,
        isDropTarget && "ring-2 ring-primary/40 ring-offset-1"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOverLane();
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragLeaveLane();
        }
      }}
      onDrop={(e) => onDrop(e, laneId)}
    >
      <div className={cn("rounded-xl border px-4 py-3", laneMeta.headerClassName)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">{laneMeta.title}</h2>
            <p className="mt-1 text-xs leading-5 opacity-90">{laneMeta.description}</p>
          </div>
          <span className={cn("text-sm font-semibold", laneMeta.countClassName)}>
            {candidates.length}
          </span>
        </div>
        {laneId === "approved" ? (
          <div className="mt-3 space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">ATS Filter</p>
            <Select value={atsFilter} onValueChange={(value: AtsFilter) => onAtsFilterChange(value)}>
              <SelectTrigger className="h-8 border-white/70 bg-white/80 text-foreground">
                <SelectValue placeholder="ATS Filter" />
              </SelectTrigger>
              <SelectContent>
                {atsFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground">
            Loading candidates...
          </div>
        ) : candidates.length === 0 ? (
          <div
            className={cn(
              "rounded-xl border border-dashed border-border/70 bg-white/70 px-4 py-8 text-center text-sm text-muted-foreground transition-all",
              isDropTarget && "border-primary/40 bg-primary/5"
            )}
          >
            {isDropTarget
              ? `Drop here -> ${laneMeta.title}`
              : `No candidates in ${laneMeta.title.toLowerCase()}.`}
          </div>
        ) : (
          candidates.map((candidate) => {
            const atsResult = getAtsResult(candidate.aiEvaluation.atsScore);
            const isDragging = dragCandidateId === candidate.id;

            return (
              <div
                key={candidate.id}
                draggable
                onDragStart={() => onDragStart(candidate.id)}
                onDragEnd={onDragEnd}
                onClick={() => onCandidateClick(candidate.id)}
                className={cn(
                  "cursor-pointer rounded-xl border border-white/70 bg-white p-4 shadow-sm",
                  "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                  isDragging && "opacity-40 scale-95"
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCandidateClick(candidate.id);
                  }
                }}
                aria-label={`Open profile for ${candidate.name}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{candidate.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
                  </div>
                  <Badge variant={statusVariant(candidate.status)}>{candidate.status}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>Phone</span>
                    <span className="max-w-[60%] truncate text-right text-foreground">
                      {candidate.phoneNumber ?? "Not provided"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Overall</span>
                    <span className="font-semibold text-foreground">
                      {candidate.aiEvaluation.overallScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>ATS</span>
                    <span className="font-semibold text-foreground">
                      {candidate.aiEvaluation.atsScore}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[11px] font-medium",
                      atsResult === "pass"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    )}
                  >
                    ATS {atsResult}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {candidate.aiEvaluation.summary}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
