import { Card, CardDescription, CardHeader, CardTitle } from "@shared/ui";

interface CandidateMetricsProps {
  visibleCount: number;
  averageScore: number;
}

export function CandidateMetrics({ visibleCount, averageScore }: CandidateMetricsProps): JSX.Element {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Visible On Board</CardDescription>
          <CardTitle>{visibleCount}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Average AI Score</CardDescription>
          <CardTitle>{averageScore}%</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
