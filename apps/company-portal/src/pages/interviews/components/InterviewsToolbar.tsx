import { Button, cn } from "@shared/ui";
import type { DashboardView } from "../../../types/interviews";

type InterviewsToolbarProps = {
  dashboardView: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onSchedule: () => void;
  canSchedule: boolean;
};

export const InterviewsToolbar = ({
  dashboardView,
  onViewChange,
  onSchedule,
  canSchedule,
}: InterviewsToolbarProps): JSX.Element => {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
        <p className="text-sm text-muted-foreground">
          Backend-driven interview scheduling and management.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dashboardView === "list" ? "bg-white text-foreground shadow" : "text-muted-foreground"
            )}
          >
            List View
          </button>
          <button
            onClick={() => onViewChange("calendar")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dashboardView === "calendar"
                ? "bg-white text-foreground shadow"
                : "text-muted-foreground"
            )}
          >
            Calendar View
          </button>
          <button
            onClick={() => onViewChange("kanban")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dashboardView === "kanban"
                ? "bg-white text-foreground shadow"
                : "text-muted-foreground"
            )}
          >
            Kanban View
          </button>
        </div>
        <Button onClick={onSchedule} disabled={!canSchedule}>
          Schedule Interview
        </Button>
      </div>
    </div>
  );
};
