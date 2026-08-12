import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@shared/ui";
import type { Interview } from "../../../services/interviews";
import {
  endOfMonth,
  isSameDay,
  startOfMonth,
} from "../../../utils/dateUtils";
import type { CalendarMode } from "../../../types/interviews";
import { roundTypeLabel } from "../../../constants/interviews";

type CandidateLike = {
  id: string;
  name: string;
};

type InterviewCalendarSectionProps = {
  calendarMode: CalendarMode;
  calendarLabel: string;
  weekDays: Date[];
  monthCells: Date[];
  dayInterviews: Interview[];
  sortedInterviews: Interview[];
  calendarAnchorDate: Date;
  candidateMap: Map<string, CandidateLike>;
  onModeChange: (mode: CalendarMode) => void;
  onShift: (direction: -1 | 1) => void;
  onToday: () => void;
  onReschedule: (interview: Interview) => void;
};

export const InterviewCalendarSection = ({
  calendarMode,
  calendarLabel,
  weekDays,
  monthCells,
  dayInterviews,
  sortedInterviews,
  calendarAnchorDate,
  candidateMap,
  onModeChange,
  onShift,
  onToday,
  onReschedule,
}: InterviewCalendarSectionProps): JSX.Element => {
  const monthStart = startOfMonth(calendarAnchorDate);
  const monthEnd = endOfMonth(calendarAnchorDate);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>{calendarLabel}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onShift(-1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => onShift(1)}>
              Next
            </Button>
            <Select
              value={calendarMode}
              onValueChange={(value: CalendarMode) => onModeChange(value)}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {calendarMode === "day" ? (
          <div className="space-y-2">
            {Array.from({ length: 13 }, (_, index) => index + 8).map((hour) => {
              const slotInterviews = dayInterviews.filter(
                (interview) => new Date(interview.startAt).getHours() === hour
              );

              return (
                <div
                  key={hour}
                  className="grid grid-cols-[90px_1fr] gap-2 rounded-lg border border-border p-2"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {String(hour).padStart(2, "0")}:00
                  </p>
                  <div className="space-y-1">
                    {slotInterviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No interviews</p>
                    ) : (
                      slotInterviews.map((interview) => {
                        const candidate = candidateMap.get(interview.candidateId);
                        return (
                          <div
                            key={interview.id}
                            className="rounded-md border border-border bg-muted/30 px-2 py-1"
                          >
                            <p className="text-xs font-medium">
                              {candidate?.name ?? "Unknown candidate"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {roundTypeLabel[interview.roundType]}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : calendarMode === "week" ? (
          <div className="grid min-w-[980px] grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const weekInterviews = sortedInterviews.filter((interview) =>
                isSameDay(new Date(interview.startAt), day)
              );

              return (
                <div
                  key={day.toISOString()}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {day.toLocaleDateString(undefined, { weekday: "short" })}
                  </p>
                  <p className="text-sm font-semibold">
                    {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <div className="mt-3 space-y-2">
                    {weekInterviews.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No interviews</p>
                    ) : (
                      weekInterviews.map((interview) => {
                        const candidate = candidateMap.get(interview.candidateId);
                        return (
                          <button
                            key={interview.id}
                            type="button"
                            onClick={() => {
                              if (interview.status === "scheduled") {
                                onReschedule(interview);
                              }
                            }}
                            className={cn(
                              "w-full rounded-md border px-2 py-1 text-left",
                              interview.status === "scheduled"
                                ? "cursor-pointer border-border bg-muted/30"
                                : "cursor-default border-border/60 bg-muted/20"
                            )}
                          >
                            <p className="truncate text-xs font-medium">
                              {candidate?.name ?? "Unknown candidate"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {new Date(interview.startAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid min-w-[980px] grid-cols-7 gap-2">
            {monthCells.map((day) => {
              const monthInterviews = sortedInterviews.filter((interview) =>
                isSameDay(new Date(interview.startAt), day)
              );
              const inMonth = day >= monthStart && day <= monthEnd;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[120px] rounded-lg border p-2",
                    inMonth ? "border-border bg-card" : "border-border/60 bg-muted/20"
                  )}
                >
                  <p className={cn("text-xs font-semibold", !inMonth && "text-muted-foreground")}>
                    {day.getDate()}
                  </p>
                  <div className="mt-2 space-y-1">
                    {monthInterviews.slice(0, 3).map((interview) => {
                      const candidate = candidateMap.get(interview.candidateId);
                      return (
                        <p
                          key={interview.id}
                          className="truncate rounded bg-muted px-1.5 py-0.5 text-[11px]"
                        >
                          {candidate?.name ?? "Unknown"}
                        </p>
                      );
                    })}
                    {monthInterviews.length > 3 ? (
                      <p className="text-[11px] text-muted-foreground">
                        +{monthInterviews.length - 3} more
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
