import { Fragment, memo, type MouseEvent } from "react";
import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  Circle,
  FileSearch,
  GitBranch,
  Pencil,
  Square,
  Trash2,
  User,
} from "lucide-react";
import { cn } from "@shared/ui";
import type { WorkflowNodeData, WorkflowNodeKind } from "../../../types/settings";
import { getStageIcon } from "../../../utils/stageIcons";

export type WorkflowNodeCallbacks = {
  canEdit?: boolean;
  aiAgentName?: string;
  onEditStage?: (nodeId: string) => void;
  onDeleteStage?: (nodeId: string) => void;
  onEditAtsCheck?: (nodeId: string) => void;
  onDeleteAtsCheck?: (nodeId: string) => void;
};

type StageNodeData = WorkflowNodeData & WorkflowNodeCallbacks;

type WorkflowDiagramNodeProps = NodeProps & {
  data: StageNodeData;
};

const handleClass =
  "!h-3 !w-3 !rounded-full !border-2 !border-white !shadow-[0_0_0_1px_rgba(15,23,42,0.12),0_4px_10px_rgba(15,23,42,0.12)]";

const selectionRing =
  "shadow-[0_0_0_2px_rgba(59,130,246,0.35),0_10px_30px_rgba(15,23,42,0.12)]";

const cardShadow =
  "shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.08)]";

const SIDE_POSITIONS: Array<{ position: Position; id: string }> = [
  { position: Position.Top, id: "top" },
  { position: Position.Right, id: "right" },
  { position: Position.Bottom, id: "bottom" },
  { position: Position.Left, id: "left" },
];

const sideHandles = (
  colorClass: string,
  options?: { sourceOnly?: boolean; targetOnly?: boolean }
): JSX.Element => (
  <>
    {SIDE_POSITIONS.map(({ position, id }) => (
      <Fragment key={id}>
        {!options?.sourceOnly ? (
          <Handle
            id={`t-${id}`}
            type="target"
            position={position}
            className={cn(handleClass, colorClass)}
          />
        ) : null}
        {!options?.targetOnly ? (
          <Handle
            id={`s-${id}`}
            type="source"
            position={position}
            className={cn(handleClass, colorClass)}
          />
        ) : null}
      </Fragment>
    ))}
  </>
);

const StartNode = memo(({ selected }: WorkflowDiagramNodeProps): JSX.Element => (
  <div className="relative h-12 w-12 overflow-visible">
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={cn(
          "h-8 w-8 rounded-full bg-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.45)] ring-4 ring-emerald-100",
          selected && "ring-emerald-300"
        )}
        title="Start"
      />
    </div>
    <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
      Start
    </span>
    <Handle
      id="s-right"
      type="source"
      position={Position.Right}
      className={cn(handleClass, "!bg-emerald-500")}
    />
  </div>
));
StartNode.displayName = "StartNode";

const StageNode = memo(({ id, data, selected }: WorkflowDiagramNodeProps): JSX.Element => {
  const isHuman = data.stageType === "human";
  const StageIcon = getStageIcon(data.icon);
  const stop = (event: MouseEvent): void => {
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <div
      className={cn(
        "relative h-full min-h-[88px] w-full min-w-[200px] rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-4 py-3 transition-shadow",
        cardShadow,
        selected && selectionRing
      )}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={88}
        lineClassName="!border-sky-400"
        handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-sky-500 !bg-white"
      />
      {sideHandles("!bg-sky-500")}

      <div className="mb-1.5 flex items-center justify-between gap-2 pl-1">
        <div className="flex items-center gap-2 text-sky-700">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-100 text-sky-700">
            <StageIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Stage</span>
        </div>

        {data.canEdit ? (
          <div className="nodrag nopan flex items-center gap-0.5">
            <button
              type="button"
              title="Edit stage"
              className="rounded-md p-1 text-slate-500 transition hover:bg-sky-100 hover:text-sky-700"
              onMouseDown={stop}
              onClick={(event) => {
                stop(event);
                data.onEditStage?.(id);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Remove stage"
              className="rounded-md p-1 text-slate-500 transition hover:bg-rose-100 hover:text-rose-700"
              onMouseDown={stop}
              onClick={(event) => {
                stop(event);
                data.onDeleteStage?.(id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="pl-1 text-sm font-semibold tracking-tight text-slate-900">{data.label}</p>

      <div className="mt-2 flex items-center gap-1.5 pl-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isHuman ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"
          )}
        >
          {isHuman ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
          {isHuman ? "Human" : "AI Agent"}
        </span>
        {isHuman && data.assigneeEmail ? (
          <span className="truncate text-[10px] text-slate-500">{data.assigneeEmail}</span>
        ) : null}
        {!isHuman && data.aiAgentName ? (
          <span className="truncate text-[10px] text-slate-500">{data.aiAgentName}</span>
        ) : null}
      </div>
    </div>
  );
});
StageNode.displayName = "StageNode";

const AtsCheckNode = memo(({ id, data, selected }: WorkflowDiagramNodeProps): JSX.Element => {
  const stop = (event: MouseEvent): void => {
    event.stopPropagation();
    event.preventDefault();
  };

  return (
    <div
      className={cn(
        "relative h-full min-h-[80px] w-full min-w-[180px] rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-3 transition-shadow",
        cardShadow,
        selected && selectionRing
      )}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={180}
        minHeight={80}
        lineClassName="!border-teal-400"
        handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-teal-500 !bg-white"
      />
      {sideHandles("!bg-teal-500")}

      <div className="mb-1.5 flex items-center justify-between gap-2 pl-1">
        <div className="flex items-center gap-2 text-teal-700">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-teal-100 text-teal-700">
            <FileSearch className="h-3.5 w-3.5" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">ATS Check</span>
        </div>

        {data.canEdit ? (
          <div className="nodrag nopan flex items-center gap-0.5">
            <button
              type="button"
              title="Edit ATS check"
              className="rounded-md p-1 text-slate-500 transition hover:bg-teal-100 hover:text-teal-700"
              onMouseDown={stop}
              onClick={(event) => {
                stop(event);
                data.onEditAtsCheck?.(id);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Remove ATS check"
              className="rounded-md p-1 text-slate-500 transition hover:bg-rose-100 hover:text-rose-700"
              onMouseDown={stop}
              onClick={(event) => {
                stop(event);
                data.onDeleteAtsCheck?.(id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <p className="pl-1 text-sm font-semibold tracking-tight text-slate-900">{data.label}</p>
    </div>
  );
});
AtsCheckNode.displayName = "AtsCheckNode";

const ConditionNode = memo(({ data, selected }: WorkflowDiagramNodeProps): JSX.Element => (
  <div className={cn("relative h-full min-h-[140px] w-full min-w-[140px]", selected && "z-10")}>
    <NodeResizer
      isVisible={selected}
      minWidth={140}
      minHeight={140}
      keepAspectRatio
      lineClassName="!border-amber-400"
      handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-amber-500 !bg-white"
    />

    <div
      className={cn(
        "absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[16px] border border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-orange-50 transition-shadow",
        cardShadow,
        selected && selectionRing
      )}
    />

    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="flex max-w-[45%] flex-col items-center justify-center gap-1 text-center">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
          <GitBranch className="h-3 w-3" />
        </span>
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug tracking-tight text-slate-900">
          {data.label}
        </p>
      </div>
    </div>

    <Handle
      id="t-top"
      type="target"
      position={Position.Top}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ top: "9%", left: "50%" }}
    />
    <Handle
      id="t-left"
      type="target"
      position={Position.Left}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ top: "50%", left: "9%" }}
    />
    <Handle
      id="t-right"
      type="target"
      position={Position.Right}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ top: "50%", right: "9%" }}
    />
    <Handle
      id="t-bottom"
      type="target"
      position={Position.Bottom}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ bottom: "9%", left: "50%" }}
    />

    <Handle
      id="yes"
      type="source"
      position={Position.Right}
      className={cn(handleClass, "!bg-emerald-500")}
      style={{ top: "50%", right: "9%" }}
    />
    <Handle
      id="no"
      type="source"
      position={Position.Bottom}
      className={cn(handleClass, "!bg-rose-500")}
      style={{ bottom: "9%", left: "50%" }}
    />
    <Handle
      id="s-left"
      type="source"
      position={Position.Left}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ top: "50%", left: "9%" }}
    />
    <Handle
      id="s-top"
      type="source"
      position={Position.Top}
      className={cn(handleClass, "!bg-amber-500")}
      style={{ top: "9%", left: "50%" }}
    />

    <span
      className="pointer-events-none absolute z-20 rounded-full border border-emerald-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 shadow-sm"
      style={{ top: "50%", right: "0%", transform: "translateY(-50%)" }}
    >
      Yes
    </span>
    <span
      className="pointer-events-none absolute z-20 rounded-full border border-rose-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-rose-700 shadow-sm"
      style={{ bottom: "0%", left: "50%", transform: "translateX(-50%)" }}
    >
      No
    </span>
  </div>
));
ConditionNode.displayName = "ConditionNode";

const EndNode = memo(({ selected }: WorkflowDiagramNodeProps): JSX.Element => (
  <div className="relative h-12 w-12 overflow-visible">
    <Handle
      id="t-left"
      type="target"
      position={Position.Left}
      className={cn(handleClass, "!bg-slate-700")}
    />
    <div className="flex h-full w-full items-center justify-center">
      <div
        className={cn(
          "h-8 w-8 rounded-full bg-slate-800 shadow-[0_4px_14px_rgba(15,23,42,0.35)] ring-4 ring-slate-200",
          selected && "ring-slate-400"
        )}
        title="End"
      />
    </div>
    <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
      End
    </span>
  </div>
));
EndNode.displayName = "EndNode";

export const workflowNodeTypes = {
  start: StartNode,
  stage: StageNode,
  atsCheck: AtsCheckNode,
  condition: ConditionNode,
  end: EndNode,
};

/** Palette extras — catalog stages are added separately; Start/End always on canvas. */
export const workflowPaletteItems: Array<{
  kind: WorkflowNodeKind;
  label: string;
  description: string;
  previewClassName: string;
  icon: typeof Circle;
  onceOnly?: boolean;
}> = [];

export const defaultLabelForKind = (kind: WorkflowNodeKind): string => {
  switch (kind) {
    case "start":
      return "Start";
    case "stage":
      return "Interview Stage";
    case "atsCheck":
      return "ATS Check";
    case "condition":
      return "Passed?";
    case "end":
      return "End";
    default:
      return "Node";
  }
};
