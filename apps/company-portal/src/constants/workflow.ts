import type { WorkflowFlowEdge, WorkflowFlowNode } from "../types/settings";

const newId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

/** Default canvas: Start and End as independent nodes (user draws connections) */
export const createDefaultWorkflowGraph = (): {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
} => {
  const startId = newId();
  const endId = newId();

  return {
    nodes: [
      {
        id: startId,
        type: "start",
        position: { x: 160, y: 200 },
        style: { width: 48, height: 48 },
        data: { kind: "start", label: "Start", disconnected: true },
      },
      {
        id: endId,
        type: "end",
        position: { x: 480, y: 200 },
        style: { width: 48, height: 48 },
        data: { kind: "end", label: "End" },
      },
    ],
    edges: [],
  };
};

export const workflowHasStartNode = (nodes: WorkflowFlowNode[]): boolean =>
  nodes.some((node) => node.type === "start" || node.data?.kind === "start");

export const workflowHasEndNode = (nodes: WorkflowFlowNode[]): boolean =>
  nodes.some((node) => node.type === "end" || node.data?.kind === "end");
