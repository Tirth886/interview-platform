import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui";
import type { JobRecord } from "../../../types/jobs";

type JobListSectionProps = {
  jobs: JobRecord[];
  candidateCountByJob: Record<string, number>;
  onEdit: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  onCopyPublicLink: (slug: string) => void;
};

export const JobListSection = ({
  jobs,
  candidateCountByJob,
  onEdit,
  onDelete,
  onCopyPublicLink,
}: JobListSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Jobs</CardTitle>
        <CardDescription>
          Title, status, candidate count, created date, and quick actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {jobs.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No jobs yet. Create your first job to start hiring.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col gap-3 rounded-md border border-border p-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{job.title}</p>
                <p className="text-xs text-muted-foreground">
                  {job.createdAt.slice(0, 10)} · {candidateCountByJob[job.id] ?? 0} candidates
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={job.status === "published" ? "success" : "secondary"}>
                  {job.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => onEdit(job.id)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/app/jobs/${job.id}`}>Open</Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => onCopyPublicLink(job.slug)}>
                  Copy Public Link
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(job.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
