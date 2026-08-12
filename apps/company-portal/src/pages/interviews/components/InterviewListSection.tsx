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
import type { Interview } from "../../../services/interviews";
import { formatDateTimeDisplay } from "../../../utils/dateUtils";
import { roundTypeLabel, statusVariant } from "../../../constants/interviews";

type CandidateLike = {
  id: string;
  name: string;
};

type InterviewListSectionProps = {
  interviews: Interview[];
  candidateMap: Map<string, CandidateLike>;
  onReschedule: (interview: Interview) => void;
  onCancel: (interview: Interview) => void;
};

export const InterviewListSection = ({
  interviews,
  candidateMap,
  onReschedule,
  onCancel,
}: InterviewListSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview List</CardTitle>
        <CardDescription>
          {interviews.length} interview{interviews.length !== 1 ? "s" : ""} total
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>Round Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((interview) => {
              const candidate = candidateMap.get(interview.candidateId);
              return (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">
                    {candidate?.name ?? "Unknown candidate"}
                  </TableCell>
                  <TableCell>{roundTypeLabel[interview.roundType]}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[interview.status]}>{interview.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDateTimeDisplay(interview.startAt)}</TableCell>
                  <TableCell>{interview.durationMinutes} min</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {interview.status === "scheduled" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReschedule(interview)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onCancel(interview)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{interview.status}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
