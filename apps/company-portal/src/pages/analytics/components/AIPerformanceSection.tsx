import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

type AIPerformanceSectionProps = {
  autoScreened: number;
  autoRejected: number;
  aiShortlisted: number;
};

export const AIPerformanceSection = ({
  autoScreened,
  autoRejected,
  aiShortlisted,
}: AIPerformanceSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Performance Insights</CardTitle>
        <CardDescription>Visibility into AI screening outcomes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Candidates auto-screened by AI</p>
          <p className="text-2xl font-semibold">{autoScreened}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">Auto-rejected candidates</p>
          <p className="text-2xl font-semibold text-rose-700">{autoRejected}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">AI shortlisted candidates</p>
          <p className="text-2xl font-semibold text-emerald-700">{aiShortlisted}</p>
        </div>
      </CardContent>
    </Card>
  );
};
