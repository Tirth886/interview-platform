import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui";
import { WorkflowConfigurator } from "./WorkflowConfigurator";

type HiringWorkflowSectionProps = {
  canEdit: boolean;
  workflowCount: number;
  designationCount: number;
  workflowCoverage: number;
};

export const HiringWorkflowSection = ({
  canEdit,
  workflowCount,
  designationCount,
  workflowCoverage,
}: HiringWorkflowSectionProps): JSX.Element => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Workflow Coverage</CardTitle>
        <CardDescription>
          {workflowCount} workflows configured for {designationCount} designations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground">Coverage</p>
          <p className="text-2xl font-semibold text-foreground">{workflowCoverage}%</p>
        </div>
      </CardContent>
    </Card>
    <WorkflowConfigurator canEdit={canEdit} />
  </div>
);
