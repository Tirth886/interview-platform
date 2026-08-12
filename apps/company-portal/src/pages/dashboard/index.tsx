import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Users } from "lucide-react";
import { useDashboardStore } from "../../stores/useDashboardStore";
import { MetricCard } from "./components/MetricCard";
import { AIInsightsSection } from "./components/AIInsightsSection";
import { InterviewStatusSection } from "./components/InterviewStatusSection";
import { RecentActivitySection } from "./components/RecentActivitySection";

export default function DashboardPage(): JSX.Element {
  const candidates = useDashboardStore((state) => state.candidates);
  const interviews = useDashboardStore((state) => state.interviews);
  const activities = useDashboardStore((state) => state.activities);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const interviewsInProgress = useMemo(
    () => interviews.filter((item) => item.status === "in-progress").length,
    [interviews]
  );

  const interviewsCompleted = useMemo(
    () => interviews.filter((item) => item.status === "completed").length,
    [interviews]
  );

  const recentActivity = useMemo(
    () => [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [activities]
  );

  const aiAutoScreened = useMemo(
    () =>
      activities
        .filter((item) => item.type === "ai_auto_screened")
        .reduce((sum, item) => sum + (item.count ?? 0), 0),
    [activities]
  );

  const aiShortlisted = useMemo(
    () =>
      activities
        .filter((item) => item.type === "ai_shortlisted")
        .reduce((sum, item) => sum + (item.count ?? 0), 0),
    [activities]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          High-level overview of candidates and interviews.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Candidates" value={candidates.length} icon={Users} />
        <MetricCard title="Total Interviews" value={interviews.length} icon={CalendarCheck2} />
        <MetricCard
          title="In Progress"
          value={interviewsInProgress}
          icon={CalendarCheck2}
          iconClassName="text-amber-600"
        />
        <MetricCard
          title="Completed"
          value={interviewsCompleted}
          icon={CalendarCheck2}
          iconClassName="text-emerald-600"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AIInsightsSection autoScreened={aiAutoScreened} shortlisted={aiShortlisted} />
        <InterviewStatusSection interviews={interviews} />
      </div>

      <RecentActivitySection activities={recentActivity} nowMs={nowMs} />
    </div>
  );
}
