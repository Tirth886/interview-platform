import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

type AIInsightsSectionProps = {
  autoScreened: number;
  shortlisted: number;
};

export const AIInsightsSection = ({
  autoScreened,
  shortlisted,
}: AIInsightsSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <CardDescription>Intelligence from recent AI activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Auto-screened Today
          </p>
          <p className="text-xl font-semibold text-foreground">{autoScreened}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Shortlisted by AI
          </p>
          <p className="text-xl font-semibold text-foreground">{shortlisted}</p>
        </div>
        {autoScreened === 0 && shortlisted === 0 && (
          <p className="text-sm text-muted-foreground">No AI insight events yet.</p>
        )}
      </CardContent>
    </Card>
  );
};
