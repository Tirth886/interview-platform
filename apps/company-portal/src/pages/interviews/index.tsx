import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import {
  cancelInterview,
  createInterview,
  listInterviews,
  rescheduleInterview,
  type CreateInterviewPayload,
  type Interview,
  type InterviewStatus,
} from "../../services/interviews";
import { useAuthStore } from "../../stores/useAuthStore";
import { listCandidates } from "../../services/candidates";
import { InterviewsToolbar } from "./components/InterviewsToolbar";
import { InterviewListSection } from "./components/InterviewListSection";
import { InterviewCalendarSection } from "./components/InterviewCalendarSection";
import { InterviewKanbanSection } from "./components/InterviewKanbanSection";
import { InterviewDialog } from "./components/InterviewDialog";
import type { CalendarMode, DashboardView, DialogMode, InterviewFormData } from "../../types/interviews";
import {
  addDays,
  atDayStart,
  isSameDay,
  startOfWeek,
  toLocalDateTimeValue,
} from "../../utils/dateUtils";

export default function InterviewsPage(): JSX.Element {
  const session = useAuthStore((state) => state.session);

  const [dashboardView, setDashboardView] = useState<DashboardView>("list");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("week");
  const [calendarAnchorDate, setCalendarAnchorDate] = useState<Date>(new Date());

  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<InterviewFormData>({
    candidateId: "",
    roundType: "ai-interview",
    startAtLocal: "",
    durationMinutes: "45",
    instructions: "",
  });

  const backendInterviewsQuery = useQuery({
    queryKey: ["backend-interviews", session?.token],
    queryFn: () => {
      if (!session?.token) {
        return Promise.resolve([]);
      }
      return listInterviews(undefined, session.token);
    },
    enabled: Boolean(session?.token),
  });

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
  const interviews = backendInterviewsQuery.data ?? [];

  const candidateMap = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.id, candidate])),
    [candidates]
  );

  const sortedInterviews = useMemo(
    () =>
      [...interviews].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
      ),
    [interviews]
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(calendarAnchorDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [calendarAnchorDate]);

  const monthGridStart = startOfWeek(
    new Date(calendarAnchorDate.getFullYear(), calendarAnchorDate.getMonth(), 1)
  );
  const monthCells = useMemo(
    () => Array.from({ length: 42 }, (_, index) => addDays(monthGridStart, index)),
    [monthGridStart]
  );

  const dayStart = atDayStart(calendarAnchorDate);
  const dayInterviews = useMemo(
    () => sortedInterviews.filter((interview) => isSameDay(new Date(interview.startAt), dayStart)),
    [dayStart, sortedInterviews]
  );

  const calendarLabel = useMemo(() => {
    if (calendarMode === "day") {
      return calendarAnchorDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    if (calendarMode === "week") {
      const start = startOfWeek(calendarAnchorDate);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    return calendarAnchorDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [calendarAnchorDate, calendarMode]);

  const kanbanColumns = useMemo(() => {
    const columns: Record<InterviewStatus, Interview[]> = {
      scheduled: [],
      "in-progress": [],
      completed: [],
      cancelled: [],
    };

    sortedInterviews.forEach((interview) => {
      columns[interview.status].push(interview);
    });

    return columns;
  }, [sortedInterviews]);

  const createInterviewMutation = useMutation({
    mutationFn: (payload: CreateInterviewPayload) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }
      return createInterview(payload, session.token);
    },
    onSuccess: () => {
      void backendInterviewsQuery.refetch();
      setError(null);
      setMessage("Interview scheduled successfully.");
      setDialogOpen(false);
      resetForm();
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to schedule interview."
      );
    },
  });

  const rescheduleInterviewMutation = useMutation({
    mutationFn: (payload: { interviewId: string; startAt: string; durationMinutes: number }) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }
      return rescheduleInterview(
        payload.interviewId,
        {
          startAt: payload.startAt,
          durationMinutes: payload.durationMinutes,
        },
        session.token
      );
    },
    onSuccess: () => {
      void backendInterviewsQuery.refetch();
      setError(null);
      setMessage("Interview rescheduled successfully.");
      setDialogOpen(false);
      resetForm();
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to reschedule interview."
      );
    },
  });

  const cancelInterviewMutation = useMutation({
    mutationFn: (interviewId: string) => {
      if (!session?.token) {
        throw new Error("Session expired. Please login again.");
      }
      return cancelInterview(interviewId, session.token);
    },
    onSuccess: () => {
      void backendInterviewsQuery.refetch();
      setError(null);
      setMessage("Interview cancelled successfully.");
      setDialogOpen(false);
    },
    onError: (mutationError: unknown) => {
      setMessage(null);
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to cancel interview."
      );
    },
  });

  const resetForm = (): void => {
    setFormData({
      candidateId: candidates[0]?.id ?? "",
      roundType: "ai-interview",
      startAtLocal: toLocalDateTimeValue(new Date().toISOString()),
      durationMinutes: "45",
      instructions: "",
    });
  };

  const openCreateDialog = (): void => {
    setDialogMode("create");
    setSelectedInterview(null);
    resetForm();
    setError(null);
    setMessage(null);
    setDialogOpen(true);
  };

  const openRescheduleDialog = (interview: Interview): void => {
    setDialogMode("reschedule");
    setSelectedInterview(interview);
    setFormData({
      candidateId: interview.candidateId,
      roundType: interview.roundType,
      startAtLocal: toLocalDateTimeValue(interview.startAt),
      durationMinutes: String(interview.durationMinutes),
      instructions: interview.instructions,
    });
    setError(null);
    setMessage(null);
    setDialogOpen(true);
  };

  const openCancelDialog = (interview: Interview): void => {
    setDialogMode("cancel");
    setSelectedInterview(interview);
    setError(null);
    setMessage(null);
    setDialogOpen(true);
  };

  const shiftCalendar = (direction: -1 | 1): void => {
    setCalendarAnchorDate((prev) => {
      if (calendarMode === "day") {
        return addDays(prev, direction);
      }
      if (calendarMode === "week") {
        return addDays(prev, direction * 7);
      }
      return new Date(prev.getFullYear(), prev.getMonth() + direction, prev.getDate());
    });
  };

  const handleSubmit = (): void => {
    setError(null);
    setMessage(null);

    if (!formData.candidateId) {
      setError("Candidate is required.");
      return;
    }

    if (!formData.startAtLocal) {
      setError("Start date and time are required.");
      return;
    }

    const durationMin = Number.parseInt(formData.durationMinutes, 10);
    if (Number.isNaN(durationMin) || durationMin < 15 || durationMin > 360) {
      setError("Duration must be between 15 and 360 minutes.");
      return;
    }

    if (!formData.instructions.trim()) {
      setError("Instructions are required.");
      return;
    }

    const startAt = new Date(formData.startAtLocal).toISOString();

    if (dialogMode === "create") {
      createInterviewMutation.mutate({
        candidateId: formData.candidateId,
        roundType: formData.roundType,
        startAt,
        durationMinutes: durationMin,
        instructions: formData.instructions.trim(),
      });
      return;
    }

    if (dialogMode === "reschedule" && selectedInterview) {
      rescheduleInterviewMutation.mutate({
        interviewId: selectedInterview.id,
        startAt,
        durationMinutes: durationMin,
      });
    }
  };

  const isDialogPending =
    createInterviewMutation.isPending ||
    rescheduleInterviewMutation.isPending ||
    cancelInterviewMutation.isPending;

  return (
    <div className="space-y-4">
      <InterviewsToolbar
        dashboardView={dashboardView}
        onViewChange={setDashboardView}
        onSchedule={openCreateDialog}
        canSchedule={candidates.length > 0}
      />

      {backendInterviewsQuery.isError ? (
        <Card className="border-destructive/25 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to load interviews</CardTitle>
            <CardDescription>
              {backendInterviewsQuery.error instanceof Error
                ? backendInterviewsQuery.error.message
                : "An error occurred while fetching interviews."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {interviews.length === 0 && !backendInterviewsQuery.isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>No Interviews Scheduled</CardTitle>
            <CardDescription>
              Create the first interview by clicking Schedule Interview above.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : dashboardView === "list" ? (
        <InterviewListSection
          interviews={sortedInterviews}
          candidateMap={candidateMap}
          onReschedule={openRescheduleDialog}
          onCancel={openCancelDialog}
        />
      ) : dashboardView === "calendar" ? (
        <InterviewCalendarSection
          calendarMode={calendarMode}
          calendarLabel={calendarLabel}
          weekDays={weekDays}
          monthCells={monthCells}
          dayInterviews={dayInterviews}
          sortedInterviews={sortedInterviews}
          calendarAnchorDate={calendarAnchorDate}
          candidateMap={candidateMap}
          onModeChange={setCalendarMode}
          onShift={shiftCalendar}
          onToday={() => setCalendarAnchorDate(new Date())}
          onReschedule={openRescheduleDialog}
        />
      ) : (
        <InterviewKanbanSection
          columns={kanbanColumns}
          candidateMap={candidateMap}
          onReschedule={openRescheduleDialog}
          onCancel={openCancelDialog}
        />
      )}

      <InterviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        dialogMode={dialogMode}
        selectedInterview={selectedInterview}
        formData={formData}
        onFormChange={setFormData}
        candidates={candidates}
        candidateMap={candidateMap}
        error={error}
        message={message}
        isPending={isDialogPending}
        onSubmit={handleSubmit}
        onConfirmCancel={() => {
          if (selectedInterview) {
            cancelInterviewMutation.mutate(selectedInterview.id);
          }
        }}
      />
    </div>
  );
}
