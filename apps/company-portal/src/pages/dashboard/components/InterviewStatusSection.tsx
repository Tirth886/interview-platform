import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import type { DashboardInterview } from "../../../types/dashboard";

type InterviewStatusSectionProps = {
  interviews: DashboardInterview[];
};

const statuses = ["scheduled", "in-progress", "completed", "cancelled"] as const;

export const InterviewStatusSection = ({
  interviews,
}: InterviewStatusSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Status Distribution</CardTitle>
        <CardDescription>Breakdown of all interviews by status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {statuses.map((status) => {
          const count = interviews.filter((interview) => interview.status === status).length;
          return (
            <div key={status} className="flex items-center justify-between">
              <span className="text-sm capitalize text-foreground">{status}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
