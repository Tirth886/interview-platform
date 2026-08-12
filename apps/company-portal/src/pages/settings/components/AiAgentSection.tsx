import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui";
import { AiAgentManager } from "./AiAgentManager";

type AiAgentSectionProps = {
  canEdit: boolean;
  agentCount: number;
};

export const AiAgentSection = ({ canEdit, agentCount }: AiAgentSectionProps): JSX.Element => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Library</CardTitle>
        <CardDescription>
          {agentCount} agents configured with Markdown-based context rules.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground">Available Agents</p>
          <p className="text-2xl font-semibold text-foreground">{agentCount}</p>
        </div>
      </CardContent>
    </Card>
    <AiAgentManager canEdit={canEdit} />
  </div>
);
