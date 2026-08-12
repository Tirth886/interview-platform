import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
} from "@shared/ui";
import type { Interview, InterviewStatus } from "../../../services/interviews";
import { formatDateTimeDisplay } from "../../../utils/dateUtils";
import { roundTypeLabel, statusVariant } from "../../../constants/interviews";

type CandidateLike = {
  id: string;
  name: string;
};

type InterviewKanbanSectionProps = {
  columns: Record<InterviewStatus, Interview[]>;
  candidateMap: Map<string, CandidateLike>;
  onReschedule: (interview: Interview) => void;
  onCancel: (interview: Interview) => void;
};

export const InterviewKanbanSection = ({
  columns,
  candidateMap,
  onReschedule,
  onCancel,
}: InterviewKanbanSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kanban View</CardTitle>
        <CardDescription>Interview pipeline grouped by status.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="grid min-w-[1100px] gap-4 xl:grid-cols-4">
          {(["scheduled", "in-progress", "completed", "cancelled"] as InterviewStatus[]).map(
            (status) => (
              <div
                key={status}
                className={cn(
                  "rounded-2xl border p-3",
                  status === "scheduled" && "border-sky-200 bg-sky-50/60",
                  status === "in-progress" && "border-amber-200 bg-amber-50/60",
                  status === "completed" && "border-emerald-200 bg-emerald-50/60",
                  status === "cancelled" && "border-rose-200 bg-rose-50/60"
                )}
              >
                <div className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <h3 className="text-sm font-semibold capitalize">
                    {status.replace("-", " ")}
                  </h3>
                  <Badge variant={statusVariant[status]}>{columns[status].length}</Badge>
                </div>

                <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {columns[status].length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 bg-white/60 px-3 py-4 text-center text-xs text-muted-foreground">
                      No interviews
                    </p>
                  ) : (
                    columns[status].map((interview) => {
                      const candidate = candidateMap.get(interview.candidateId);
                      return (
                        <div
                          key={interview.id}
                          className="rounded-xl border border-white/70 bg-white px-3 py-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold">
                              {candidate?.name ?? "Unknown candidate"}
                            </p>
                            <Badge variant={statusVariant[interview.status]}>
                              {interview.status}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {roundTypeLabel[interview.roundType]}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTimeDisplay(interview.startAt)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Duration: {interview.durationMinutes} min
                          </p>
                          {interview.status === "scheduled" ? (
                            <div className="mt-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onReschedule(interview)}
                              >
                                Reschedule
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onCancel(interview)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
