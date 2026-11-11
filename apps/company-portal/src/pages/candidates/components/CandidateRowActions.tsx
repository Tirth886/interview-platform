import { Lock, MoreHorizontal } from "lucide-react";
import { Button } from "@shared/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkflowStageOption } from "../../../utils/workflowStages";

type CandidateRowActionsProps = {
  hasResume: boolean;
  canParse: boolean;
  isParsing: boolean;
  stages: WorkflowStageOption[];
  currentStageId: string | null;
  onView: () => void;
  onResume: () => void;
  onParse: () => void;
  onMoveToStage: (stageId: string, label: string) => void;
};

export const CandidateRowActions = ({
  hasResume,
  canParse,
  isParsing,
  stages,
  currentStageId,
  onView,
  onResume,
  onParse,
  onMoveToStage,
}: CandidateRowActionsProps): JSX.Element => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Open actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
        <DropdownMenuItem disabled={!hasResume} onClick={onResume}>
          Resume
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canParse || isParsing} onClick={onParse}>
          {isParsing ? "Queuing…" : "Parse"}
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="opacity-60">
          <span className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5" />
            AI Parse
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={stages.length === 0}>Move to</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            {stages.length === 0 ? (
              <DropdownMenuItem disabled>No workflow stages</DropdownMenuItem>
            ) : (
              stages.map((stage) => (
                <DropdownMenuItem
                  key={stage.id}
                  disabled={stage.id === currentStageId}
                  onClick={() => onMoveToStage(stage.id, stage.label)}
                >
                  {stage.label}
                  {stage.id === currentStageId ? " (current)" : ""}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
