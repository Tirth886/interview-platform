import { Card, CardContent } from "@shared/ui";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  title: string;
  value: number;
  icon: LucideIcon;
  iconClassName?: string;
};

export const MetricCard = ({
  title,
  value,
  icon: Icon,
  iconClassName = "text-muted-foreground",
}: MetricCardProps): JSX.Element => {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${iconClassName}`} />
      </CardContent>
    </Card>
  );
};
