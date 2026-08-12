import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { UserCheck2 } from "lucide-react";
import type { DashboardActivity } from "../../../types/dashboard";

type RecentActivitySectionProps = {
  activities: DashboardActivity[];
  nowMs: number;
};

const formatTimeAgo = (iso: string, nowMs: number): string => {
  const diffMinutes = Math.max(1, Math.floor((nowMs - new Date(iso).getTime()) / 60000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const RecentActivitySection = ({
  activities,
  nowMs,
}: RecentActivitySectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          New applications, interview completions, and stage movements.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No recent activity yet.
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <UserCheck2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-foreground">{activity.text}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(activity.createdAt, nowMs)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
