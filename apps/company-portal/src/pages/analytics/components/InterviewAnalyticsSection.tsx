import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

type InterviewAnalyticsSectionProps = {
  totalInterviewConducted: number;
  completionRate: number;
  avgInterviewScore: number;
  avgTimeToHireDays: number;
};

export const InterviewAnalyticsSection = ({
  totalInterviewConducted,
  completionRate,
  avgInterviewScore,
  avgTimeToHireDays,
}: InterviewAnalyticsSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Analytics</CardTitle>
        <CardDescription>Execution quality of interview pipeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Total interviews conducted</p>
          <p className="text-2xl font-semibold">{totalInterviewConducted}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Completion rate</p>
          <p className="text-2xl font-semibold">{completionRate}%</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Avg interview score</p>
          <p className="text-2xl font-semibold">{avgInterviewScore}%</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Avg time to hire</p>
          <p className="text-2xl font-semibold">{avgTimeToHireDays} days</p>
        </div>
      </CardContent>
    </Card>
  );
};
