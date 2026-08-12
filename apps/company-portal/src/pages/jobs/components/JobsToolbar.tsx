import { Button } from "@shared/ui";

type JobsToolbarProps = {
  mode: "list" | "create" | "edit";
  onCreate: () => void;
  onBackToList: () => void;
};

export const JobsToolbar = ({
  mode,
  onCreate,
  onBackToList,
}: JobsToolbarProps): JSX.Element => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Create, manage, and distribute jobs with workflow auto-apply.
        </p>
      </div>
      {mode === "list" ? (
        <Button onClick={onCreate}>Create Job</Button>
      ) : (
        <Button variant="outline" onClick={onBackToList}>
          Back to List
        </Button>
      )}
    </div>
  );
};
