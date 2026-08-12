import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui";
import type { Interview } from "../../../types/interviews";
import { roundTypeLabel, statusVariant } from "../../../constants/interviews";
import { formatDateTimeDisplay } from "../../../utils/dateUtils";

type InterviewSessionsSectionProps = {
  title: string;
  description: string;
  interviews: Interview[];
  isLoading?: boolean;
  showActions?: boolean;
  onJoin?: (interview: Interview) => void;
};

export const InterviewSessionsSection = ({
  title,
  description,
  interviews,
  isLoading = false,
  showActions = false,
  onJoin,
}: InterviewSessionsSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {isLoading ? (
          <div className="rounded-md border border-dashed border-border/70 bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            Loading interviews...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Round Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{showActions ? "Start Date & Time" : "Scheduled Date & Time"}</TableHead>
                <TableHead>Duration</TableHead>
                {showActions ? <TableHead>Action</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">
                    {roundTypeLabel[interview.roundType]}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[interview.status]}>{interview.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTimeDisplay(interview.startAt)}</TableCell>
                  <TableCell>{interview.durationMinutes} min</TableCell>
                  {showActions ? (
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => onJoin?.(interview)}
                        disabled={interview.status === "scheduled"}
                      >
                        {interview.status === "in-progress" ? "Join Now" : "Ready"}
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
