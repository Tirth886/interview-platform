import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@shared/ui";

const formatPercentTrend = (current: number, previous: number): string => {
  if (previous === 0) {
    return current === 0 ? "0%" : "+100%";
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
};

type MetricCardProps = {
  title: string;
  value: number;
  current: number;
  previous: number;
};

export const MetricCard = ({
  title,
  value,
  current,
  previous,
}: MetricCardProps): JSX.Element => {
  const isUp = current > previous;
  const isDown = current < previous;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-xs font-medium",
            isUp ? "text-emerald-700" : isDown ? "text-rose-700" : "text-muted-foreground"
          )}
        >
          {isUp ? "↑" : isDown ? "↓" : "→"} {formatPercentTrend(current, previous)} vs previous period
        </p>
      </CardContent>
    </Card>
  );
};
