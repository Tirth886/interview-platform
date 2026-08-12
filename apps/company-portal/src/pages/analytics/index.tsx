import { useMemo, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { useJobManagementStore } from "../../stores/useJobManagementStore";
import { MetricCard } from "./components/MetricCard";
import { GlobalFilters } from "./components/GlobalFilters";
import type { DatePreset } from "../../types/common";
import { HiringFunnelSection } from "./components/HiringFunnelSection";
import { AIPerformanceSection } from "./components/AIPerformanceSection";
import { JobPerformanceSection } from "./components/JobPerformanceSection";
import { InterviewAnalyticsSection } from "./components/InterviewAnalyticsSection";
import { ApplicationsTimelineSection } from "./components/ApplicationsTimelineSection";
import { SourceInsightsSection } from "./components/SourceInsightsSection";
import {
  dayMs,
  atDayStart,
  addDays,
  formatDateShort,
} from "../../utils/dateUtils";

export default function AnalyticsPage(): JSX.Element {
  const jobs = useJobManagementStore((state) => state.jobs);
  const candidates = useJobManagementStore((state) => state.candidates);
  const interviews = useJobManagementStore((state) => state.interviews);

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const { currentStart, currentEnd, previousStart, previousEnd } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);

    if (preset === "custom" && customFrom && customTo) {
      const start = atDayStart(new Date(customFrom));
      const customEnd = addDays(atDayStart(new Date(customTo)), 1);
      const spanMs = Math.max(dayMs, customEnd.getTime() - start.getTime());
      const prevEnd = new Date(start.getTime());
      const prevStart = new Date(prevEnd.getTime() - spanMs);
      return {
        currentStart: start,
        currentEnd: customEnd,
        previousStart: prevStart,
        previousEnd: prevEnd,
      };
    }

    const days = preset === "7d" ? 7 : 30;
    const start = addDays(atDayStart(end), -(days - 1));
    const currentEnd = addDays(atDayStart(end), 1);
    const spanMs = currentEnd.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(prevEnd.getTime() - spanMs);

    return {
      currentStart: start,
      currentEnd,
      previousStart: prevStart,
      previousEnd: prevEnd,
    };
  }, [customFrom, customTo, preset]);

  const inWindow = (iso: string, start: Date, end: Date): boolean => {
    const ts = new Date(iso).getTime();
    return ts >= start.getTime() && ts < end.getTime();
  };

  const currentCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        if (jobFilter !== "all" && candidate.jobId !== jobFilter) {
          return false;
        }
        return inWindow(candidate.appliedAt, currentStart, currentEnd);
      }),
    [candidates, currentEnd, currentStart, jobFilter]
  );

  const previousCandidates = useMemo(
    () =>
      candidates.filter((candidate) => {
        if (jobFilter !== "all" && candidate.jobId !== jobFilter) {
          return false;
        }
        return inWindow(candidate.appliedAt, previousStart, previousEnd);
      }),
    [candidates, jobFilter, previousEnd, previousStart]
  );

  const currentInterviews = useMemo(
    () =>
      interviews.filter((interview) => {
        if (jobFilter !== "all" && interview.jobId !== jobFilter) {
          return false;
        }
        return inWindow(interview.startAt, currentStart, currentEnd);
      }),
    [currentEnd, currentStart, interviews, jobFilter]
  );

  const previousInterviews = useMemo(
    () =>
      interviews.filter((interview) => {
        if (jobFilter !== "all" && interview.jobId !== jobFilter) {
          return false;
        }
        return inWindow(interview.startAt, previousStart, previousEnd);
      }),
    [interviews, jobFilter, previousEnd, previousStart]
  );

  const shortlistedCurrent = currentCandidates.filter(
    (candidate) => candidate.status === "active" || candidate.status === "hold" || candidate.status === "selected"
  ).length;
  const shortlistedPrevious = previousCandidates.filter(
    (candidate) => candidate.status === "active" || candidate.status === "hold" || candidate.status === "selected"
  ).length;

  const selectedCurrent = currentCandidates.filter((candidate) => candidate.status === "selected").length;
  const selectedPrevious = previousCandidates.filter((candidate) => candidate.status === "selected").length;

  const currentApplications = currentCandidates.length;
  const previousApplications = previousCandidates.length;
  const currentInterviewCount = currentInterviews.length;
  const previousInterviewCount = previousInterviews.length;

  const funnelApplied = currentApplications;
  const funnelScreening = currentCandidates.filter((candidate) => candidate.status !== "rejected").length;
  const funnelInterview = new Set(
    currentInterviews
      .filter((interview) => interview.status !== "cancelled")
      .map((interview) => interview.candidateId)
  ).size;
  const funnelSelected = selectedCurrent;

  const autoScreened = currentCandidates.filter((candidate) =>
    candidate.timeline.some((event) => event.type === "automation")
  ).length;
  const autoRejected = currentCandidates.filter(
    (candidate) =>
      candidate.status === "rejected" && candidate.timeline.some((event) => event.type === "automation")
  ).length;
  const aiShortlisted = currentCandidates.filter((candidate) => {
    const job = jobs.find((item) => item.id === candidate.jobId);
    return candidate.aiEvaluation.atsScore >= (job?.expectedAtsScore ?? 70) && candidate.status !== "rejected";
  }).length;

  const scopedJobIds = jobFilter === "all" ? jobs.map((job) => job.id) : [jobFilter];

  const jobPerformanceRows = scopedJobIds
    .map((jobId) => {
      const job = jobs.find((item) => item.id === jobId);
      if (!job) {
        return null;
      }

      const jobApplications = currentCandidates.filter((candidate) => candidate.jobId === jobId).length;
      const jobSelected = currentCandidates.filter(
        (candidate) => candidate.jobId === jobId && candidate.status === "selected"
      ).length;
      const conversionRate = jobApplications === 0 ? 0 : Math.round((jobSelected / jobApplications) * 100);

      return {
        jobId,
        jobTitle: job.title,
        applications: jobApplications,
        conversionRate,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const totalInterviewConducted = currentInterviews.filter((interview) => interview.status === "completed").length;
  const completionRate =
    currentInterviews.length === 0
      ? 0
      : Math.round(
          (currentInterviews.filter((interview) => interview.status === "completed").length /
            currentInterviews.length) *
            100
        );

  const avgInterviewScore = (() => {
    const completedCandidateScores = currentInterviews
      .filter((interview) => interview.status === "completed")
      .map((interview) =>
        candidates.find((candidate) => candidate.id === interview.candidateId)?.aiEvaluation.overallScore ?? 0
      )
      .filter((score) => score > 0);

    if (completedCandidateScores.length === 0) {
      return 0;
    }

    return Math.round(
      completedCandidateScores.reduce((total, score) => total + score, 0) /
        completedCandidateScores.length
    );
  })();

  const avgTimeToHireDays = (() => {
    const selected = currentCandidates.filter((candidate) => candidate.status === "selected");
    if (selected.length === 0) {
      return 0;
    }
    const totalDays = selected.reduce((acc, candidate) => {
      const start = new Date(candidate.appliedAt).getTime();
      const end = new Date(candidate.updatedAt).getTime();
      return acc + Math.max(0, end - start) / dayMs;
    }, 0);
    return Number((totalDays / selected.length).toFixed(1));
  })();

  const sourceCounts = currentCandidates.reduce(
    (acc, candidate) => {
      const raw = `${candidate.resumeUrl} ${candidate.email}`.toLowerCase();
      if (raw.includes("linkedin")) {
        acc.LinkedIn += 1;
      } else if (raw.includes("naukri")) {
        acc.Naukri += 1;
      } else {
        acc.Direct += 1;
      }
      return acc;
    },
    { LinkedIn: 0, Naukri: 0, Direct: 0 }
  );

  const timelineDays = Math.max(1, Math.round((currentEnd.getTime() - currentStart.getTime()) / dayMs));
  const timelineLabels = Array.from({ length: timelineDays }, (_, index) =>
    formatDateShort(addDays(currentStart, index))
  );

  const applicationsByDay = Array.from({ length: timelineDays }, (_, index) => {
    const dayStart = addDays(currentStart, index);
    const dayEnd = addDays(dayStart, 1);
    return currentCandidates.filter((candidate) => inWindow(candidate.appliedAt, dayStart, dayEnd)).length;
  });

  const isEmpty = currentCandidates.length === 0 && currentInterviews.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hiring Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track funnel conversion, AI insights, job performance, and interview outcomes.
        </p>
      </div>

      <GlobalFilters
        preset={preset}
        setPreset={setPreset}
        jobFilter={jobFilter}
        setJobFilter={setJobFilter}
        customFrom={customFrom}
        setCustomFrom={setCustomFrom}
        customTo={customTo}
        setCustomTo={setCustomTo}
        jobs={jobs}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Applications"
          value={currentApplications}
          current={currentApplications}
          previous={previousApplications}
        />
        <MetricCard
          title="Total Interviews"
          value={currentInterviewCount}
          current={currentInterviewCount}
          previous={previousInterviewCount}
        />
        <MetricCard
          title="Shortlisted Candidates"
          value={shortlistedCurrent}
          current={shortlistedCurrent}
          previous={shortlistedPrevious}
        />
        <MetricCard
          title="Selected Candidates"
          value={selectedCurrent}
          current={selectedCurrent}
          previous={selectedPrevious}
        />
      </div>

      {isEmpty ? (
        <Card>
          <CardHeader>
            <CardTitle>No Analytics Data</CardTitle>
            <CardDescription>
              No candidates or interviews found for this filter range. Try broader filters.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <HiringFunnelSection
            funnelApplied={funnelApplied}
            funnelScreening={funnelScreening}
            funnelInterview={funnelInterview}
            funnelSelected={funnelSelected}
          />

          <AIPerformanceSection
            autoScreened={autoScreened}
            autoRejected={autoRejected}
            aiShortlisted={aiShortlisted}
          />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <JobPerformanceSection jobPerformanceRows={jobPerformanceRows} />

          <InterviewAnalyticsSection
            totalInterviewConducted={totalInterviewConducted}
            completionRate={completionRate}
            avgInterviewScore={avgInterviewScore}
            avgTimeToHireDays={avgTimeToHireDays}
          />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <ApplicationsTimelineSection
            timelineLabels={timelineLabels}
            applicationsByDay={applicationsByDay}
          />

          <SourceInsightsSection sourceCounts={sourceCounts} />
          </div>
        </>
      )}
    </div>
  );
}
