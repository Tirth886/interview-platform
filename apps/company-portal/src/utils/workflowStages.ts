import type { HiringWorkflow, WorkflowFlowNode } from "../types/settings";

export type WorkflowStageOption = {
  id: string;
  label: string;
};

const isStageNode = (node: WorkflowFlowNode): boolean => {
  const kind = node.data.kind ?? (node.type === "stageNode" ? "stage" : undefined);
  return kind === "stage" || kind === "atsCheck";
};

/**
 * Ordered workflow stages for progress UI / Move-to menu.
 * Walks the graph from start when possible; falls back to stage nodes by position.
 */
export const getWorkflowStageOptions = (
  workflow: HiringWorkflow | undefined | null
): WorkflowStageOption[] => {
  if (!workflow) return [];

  if (workflow.stages.length > 0) {
    return workflow.stages
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((item, index) => ({
        id: item.id ?? item.nodeId ?? item.stageId,
        label: item.name?.trim() || item.code || `Stage ${index + 1}`,
      }));
  }

  const stageNodes = workflow.nodes.filter(isStageNode);
  if (stageNodes.length === 0) {
    return [];
  }

  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, string[]>();
  for (const edge of workflow.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const start =
    workflow.nodes.find((node) => (node.data.kind ?? node.type) === "start" || node.type === "startNode") ??
    workflow.nodes.find((node) => (node.data.kind ?? "") === "start");

  const ordered: WorkflowFlowNode[] = [];
  const visited = new Set<string>();

  if (start) {
    const queue = [...(outgoing.get(start.id) ?? [])];
    while (queue.length > 0) {
      const nextId = queue.shift();
      if (!nextId || visited.has(nextId)) continue;
      visited.add(nextId);
      const node = byId.get(nextId);
      if (!node) continue;
      if (isStageNode(node)) {
        ordered.push(node);
      }
      for (const child of outgoing.get(nextId) ?? []) {
        queue.push(child);
      }
    }
  }

  const result = (ordered.length > 0 ? ordered : stageNodes).map((node) => ({
    id: node.id,
    label: node.data.label?.trim() || "Untitled stage",
  }));

  // De-dupe while preserving order
  const seen = new Set<string>();
  return result.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export const getInitialWorkflowStageId = (
  workflow: HiringWorkflow | undefined | null
): string | undefined => getWorkflowStageOptions(workflow)[0]?.id;
