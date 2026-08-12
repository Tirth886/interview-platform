import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";

type SourceCounts = {
  LinkedIn: number;
  Naukri: number;
  Direct: number;
};

type SourceInsightsSectionProps = {
  sourceCounts: SourceCounts;
};

export const SourceInsightsSection = ({
  sourceCounts,
}: SourceInsightsSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Insights</CardTitle>
        <CardDescription>Optional source snapshot from available candidate metadata.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {(["LinkedIn", "Naukri", "Direct"] as const).map((source) => (
          <div key={source} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm text-muted-foreground">{source}</span>
            <Badge variant="secondary">{sourceCounts[source]}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
