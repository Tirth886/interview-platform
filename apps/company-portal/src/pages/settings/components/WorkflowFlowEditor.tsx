import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type ReactFlowInstance,
} from "@xyflow/react";
import { ArrowLeft, CirclePlus, Trash2 } from "lucide-react";
import { Button, cn } from "@shared/ui";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { listQaBanks } from "../../../services/qaBanks";
import type {
  HiringWorkflow,
  WorkflowFlowEdge,
  WorkflowFlowNode,
  WorkflowNodeData,
  WorkflowNodeKind,
} from "../../../types/settings";
import {
  createDefaultWorkflowGraph,
  workflowHasEndNode,
  workflowHasStartNode,
} from "../../../constants/workflow";
import { EditAtsCheckDialog } from "./EditAtsCheckDialog";
import { EditStageDialog, type StageEditValues } from "./EditStageDialog";
import { defaultLabelForKind, workflowNodeTypes } from "./workflow-nodes";

type WorkflowFlowEditorProps = {
  workflow: HiringWorkflow;
  canEdit: boolean;
  onBack: () => void;
  onSave: (payload: { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] }) => void;
};

const PALETTE_MIME = "application/workflow-node-kind";

const normalizeNodeType = (type?: string): WorkflowNodeKind => {
  if (
    type === "start" ||
    type === "condition" ||
    type === "end" ||
    type === "stage" ||
    type === "atsCheck"
  ) {
    return type;
  }
  return "stage";
};

const toPersistedData = (kind: WorkflowNodeKind, data: WorkflowNodeData): WorkflowNodeData => {
  const base: WorkflowNodeData = {
    kind,
    label: String(data.label ?? defaultLabelForKind(kind)),
  };

  if (kind === "start") {
    return {
      ...base,
      disconnected: Boolean(data.disconnected),
    };
  }

  if (kind === "atsCheck") {
    return {
      ...base,
      stageDefinitionId: data.stageDefinitionId,
      icon: data.icon ?? "file-search",
    };
  }

  if (kind !== "stage") {
    return base;
  }

  const stageType: WorkflowNodeData["stageType"] =
    data.stageType === "human" ? "human" : data.stageType === "qa" ? "qa" : "ai";

  return {
    ...base,
    stageDefinitionId: data.stageDefinitionId,
    icon: data.icon,
    stageType,
    aiAgentId: stageType === "ai" ? data.aiAgentId : undefined,
    qaBankId: stageType === "qa" ? data.qaBankId : undefined,
    assigneeEmail: stageType === "human" ? data.assigneeEmail : undefined,
    passRule: data.passRule ?? null,
  };
};

const defaultSizeForKind = (
  kind: WorkflowNodeKind
): { width: number; height: number } | null => {
  switch (kind) {
    case "start":
    case "end":
      return { width: 48, height: 48 };
    case "stage":
      return { width: 220, height: 104 };
    case "atsCheck":
      return { width: 200, height: 88 };
    case "condition":
      return { width: 160, height: 160 };
    default:
      return null;
  }
};

const findNodeByKind = (
  nodes: WorkflowFlowNode[],
  kind: WorkflowNodeKind
): WorkflowFlowNode | undefined =>
  nodes.find((node) => normalizeNodeType(node.type ?? node.data.kind) === kind);

const newEdgeId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `edge-${Date.now()}`;
};

/** Prefer first stage; otherwise connect Start → End when there is no outgoing edge. */
const connectStartOutgoing = (
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): WorkflowFlowEdge[] => {
  const start = findNodeByKind(nodes, "start");
  if (!start) {
    return edges;
  }

  const target =
    findNodeByKind(nodes, "stage") ??
    findNodeByKind(nodes, "atsCheck") ??
    findNodeByKind(nodes, "end");
  if (!target) {
    return edges;
  }

  if (edges.some((edge) => edge.source === start.id)) {
    return edges.map((edge) =>
      edge.source === start.id
        ? {
            ...edge,
            sourceHandle: "s-right",
            targetHandle: edge.targetHandle || "t-left",
          }
        : edge
    );
  }

  return [
    ...edges,
    {
      id: newEdgeId(),
      source: start.id,
      target: target.id,
      sourceHandle: "s-right",
      targetHandle: "t-left",
    },
  ];
};

const resolveFlowGraph = (
  nodes: WorkflowFlowNode[],
  edges: WorkflowFlowEdge[]
): { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] } => {
  if (nodes.length === 0) {
    return createDefaultWorkflowGraph();
  }

  const defaults = createDefaultWorkflowGraph();
  let nextNodes = [...nodes];
  let nextEdges = [...edges];

  if (!workflowHasStartNode(nextNodes)) {
    const startNode = defaults.nodes.find((node) => node.type === "start");
    if (startNode) {
      const minX = Math.min(...nextNodes.map((node) => node.position.x));
      const avgY =
        nextNodes.reduce((sum, node) => sum + node.position.y, 0) / nextNodes.length;
      nextNodes = [
        {
          ...startNode,
          position: { x: Math.max(40, minX - 180), y: avgY },
        },
        ...nextNodes,
      ];
      nextEdges = connectStartOutgoing(nextNodes, nextEdges);
    }
  }

  if (!workflowHasEndNode(nextNodes)) {
    const endNode = defaults.nodes.find((node) => node.type === "end");
    if (endNode) {
      const maxX = Math.max(
        ...nextNodes.map(
          (node) => node.position.x + (Number(node.style?.width) || 220)
        )
      );
      const avgY =
        nextNodes.reduce((sum, node) => sum + node.position.y, 0) / nextNodes.length;
      nextNodes = [
        ...nextNodes,
        {
          ...endNode,
          position: { x: maxX + 80, y: avgY },
        },
      ];
    }
  }

  const start = findNodeByKind(nextNodes, "start");
  if (!start) {
    return { nodes: nextNodes, edges: nextEdges };
  }

  nextEdges = nextEdges.map((edge) =>
    edge.source === start.id
      ? {
          ...edge,
          sourceHandle: "s-right",
          targetHandle: edge.targetHandle || "t-left",
        }
      : edge
  );

  const startDisconnected = Boolean((start.data as WorkflowNodeData).disconnected);
  const hasOutgoing = nextEdges.some((edge) => edge.source === start.id);
  if (!startDisconnected && !hasOutgoing) {
    nextEdges = connectStartOutgoing(nextNodes, nextEdges);
  }

  return { nodes: nextNodes, edges: nextEdges };
};

const toFlowNodes = (nodes: WorkflowFlowNode[]): Node[] =>
  nodes.map((node) => {
    const kind = normalizeNodeType(node.type ?? node.data.kind);
    const defaults = defaultSizeForKind(kind);
    const width =
      typeof node.style?.width === "number"
        ? node.style.width
        : defaults?.width;
    const height =
      typeof node.style?.height === "number"
        ? node.style.height
        : defaults?.height;

    return {
      ...node,
      type: kind,
      deletable: kind !== "start" && kind !== "end",
      style: {
        ...(node.style ?? {}),
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
      },
      data: {
        ...node.data,
        kind,
        label: node.data.label || defaultLabelForKind(kind),
        ...(kind === "start"
          ? { disconnected: Boolean(node.data.disconnected) }
          : {}),
        ...(kind === "stage"
          ? {
              stageType:
                node.data.stageType === "human"
                  ? "human"
                  : node.data.stageType === "qa"
                    ? "qa"
                    : "ai",
              stageDefinitionId:
                node.data.stageDefinitionId ||
                (typeof (node.data as { stageId?: string }).stageId === "string"
                  ? (node.data as { stageId?: string }).stageId
                  : undefined),
              icon: node.data.icon,
              aiAgentId: node.data.aiAgentId,
              qaBankId: node.data.qaBankId,
              assigneeEmail: node.data.assigneeEmail,
              passRule: node.data.passRule ?? null,
            }
          : {}),
        ...(kind === "atsCheck"
          ? {
              stageDefinitionId: node.data.stageDefinitionId,
              icon: node.data.icon ?? "file-search",
            }
          : {}),
      },
    };
  });

const toFlowEdges = (edges: WorkflowFlowEdge[]): Edge[] =>
  edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    animated: true,
    deletable: true,
    selectable: true,
    interactionWidth: 24,
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: "#94a3b8",
    },
  }));

export const WorkflowFlowEditor = ({
  workflow,
  canEdit,
  onBack,
  onSave,
}: WorkflowFlowEditorProps): JSX.Element => {
  const aiAgents = useSettingsStore((state) => state.aiAgents ?? []);
  const stageCatalog = useSettingsStore((state) => state.masterData.stages ?? []);
  const session = useAuthStore((state) => state.session);
  const [qaBanks, setQaBanks] = useState<Array<{ id: string; name: string }>>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingAtsId, setEditingAtsId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const initialGraph = resolveFlowGraph(workflow.nodes, workflow.edges);
  const [nodes, setNodes, onNodesChange] = useNodesState(toFlowNodes(initialGraph.nodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initialGraph.edges));
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    const graph = resolveFlowGraph(workflow.nodes, workflow.edges);
    setNodes(toFlowNodes(graph.nodes));
    setEdges(toFlowEdges(graph.edges));
    setSavedMessage(null);
    setDropError(null);
    setEditingStageId(null);
    setEditingAtsId(null);
    setSelectedEdgeId(null);
  }, [workflow.id, workflow.nodes, workflow.edges, setNodes, setEdges]);

  useEffect(() => {
    if (!session?.token) return;
    void listQaBanks(session.token)
      .then((items) => setQaBanks(items.map((item) => ({ id: item.id, name: item.name }))))
      .catch(() => setQaBanks([]));
  }, [session?.token]);

  const markStartDisconnected = useCallback(
    (disconnected: boolean) => {
      setNodes((current) =>
        current.map((node) =>
          normalizeNodeType(node.type) === "start"
            ? {
                ...node,
                data: {
                  ...node.data,
                  disconnected,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  const removeSelectedEdge = useCallback(() => {
    if (!canEdit || !selectedEdgeId) {
      return;
    }
    const removed = edges.find((edge) => edge.id === selectedEdgeId);
    setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    if (removed) {
      const start = nodes.find((node) => node.id === removed.source);
      if (start && normalizeNodeType(start.type) === "start") {
        markStartDisconnected(true);
      }
    }
    setSelectedEdgeId(null);
    setSavedMessage(null);
  }, [canEdit, selectedEdgeId, edges, nodes, setEdges, markStartDisconnected]);

  const deleteRemovableNode = useCallback(
    (nodeId: string) => {
      const target = nodes.find((node) => node.id === nodeId);
      const kind = target ? normalizeNodeType(target.type) : null;
      if (kind === "start" || kind === "end") {
        return;
      }
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSavedMessage(null);
      if (editingStageId === nodeId) {
        setEditingStageId(null);
      }
      if (editingAtsId === nodeId) {
        setEditingAtsId(null);
      }
    },
    [nodes, editingStageId, editingAtsId, setEdges, setNodes]
  );

  const openEditStage = useCallback((nodeId: string) => {
    setEditingStageId(nodeId);
  }, []);

  const openEditAtsCheck = useCallback((nodeId: string) => {
    setEditingAtsId(nodeId);
  }, []);

  const aiAgentNameById = useMemo(
    () => new Map(aiAgents.map((agent) => [agent.id, agent.name])),
    [aiAgents]
  );

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const kind = normalizeNodeType(node.type);
        if (kind === "stage") {
          const agentId = (node.data as WorkflowNodeData).aiAgentId;
          return {
            ...node,
            data: {
              ...node.data,
              canEdit,
              aiAgentName: agentId ? aiAgentNameById.get(agentId) : undefined,
              onEditStage: openEditStage,
              onDeleteStage: deleteRemovableNode,
            },
          };
        }
        if (kind === "atsCheck") {
          return {
            ...node,
            data: {
              ...node.data,
              canEdit,
              onEditAtsCheck: openEditAtsCheck,
              onDeleteAtsCheck: deleteRemovableNode,
            },
          };
        }
        return node;
      }),
    [
      nodes,
      canEdit,
      openEditStage,
      openEditAtsCheck,
      deleteRemovableNode,
      aiAgentNameById,
    ]
  );

  const editingNode = useMemo(
    () => (editingStageId ? nodes.find((node) => node.id === editingStageId) ?? null : null),
    [editingStageId, nodes]
  );

  const editingAtsNode = useMemo(
    () => (editingAtsId ? nodes.find((node) => node.id === editingAtsId) ?? null : null),
    [editingAtsId, nodes]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: "#94a3b8",
      },
    }),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!canEdit) {
        return;
      }
      const sourceNode = nodes.find((node) => node.id === connection.source);
      if (sourceNode && normalizeNodeType(sourceNode.type) === "start") {
        markStartDisconnected(false);
      }
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            ...defaultEdgeOptions,
            deletable: true,
            selectable: true,
            interactionWidth: 28,
          },
          current
        )
      );
      setSavedMessage(null);
    },
    [canEdit, defaultEdgeOptions, setEdges, nodes, markStartDisconnected]
  );

  const displayEdges = useMemo(
    (): Edge[] =>
      edges.map((edge) => ({
        ...edge,
        selected: edge.id === selectedEdgeId,
        style: {
          ...edge.style,
          stroke: edge.id === selectedEdgeId ? "#0ea5e9" : "#94a3b8",
          strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
        },
      })),
    [edges, selectedEdgeId]
  );

  const onPaletteDragStart = (event: DragEvent<HTMLButtonElement>): void => {
    event.dataTransfer.setData(PALETTE_MIME, "stage");
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const addStageAt = useCallback(
    (position: { x: number; y: number }) => {
      const size = defaultSizeForKind("stage");
      const label = "Interview Stage";

      setNodes((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: "stage",
          position,
          deletable: true,
          style: {
            ...(size?.width ? { width: size.width } : {}),
            ...(size?.height ? { height: size.height } : {}),
          },
          data: {
            kind: "stage",
            label,
            stageType: "ai" as const,
            icon: "circle",
          },
        },
      ]);
      setDropError(null);
      setSavedMessage(null);
    },
    [setNodes]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (!canEdit || !reactFlowInstance) {
        return;
      }

      const kind = event.dataTransfer.getData(PALETTE_MIME) as WorkflowNodeKind;
      if (kind !== "stage") {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addStageAt(position);
    },
    [addStageAt, canEdit, reactFlowInstance]
  );

  const addStageFromPalette = useCallback(() => {
    if (!canEdit) {
      return;
    }
    const center = reactFlowInstance
      ? reactFlowInstance.screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        })
      : { x: 320, y: 200 };
    addStageAt(center);
  }, [addStageAt, canEdit, reactFlowInstance]);

  const handleStageSave = (values: StageEditValues): void => {
    if (!editingStageId) {
      return;
    }
    setNodes((current) =>
      current.map((node) =>
        node.id === editingStageId
          ? {
              ...node,
              data: {
                ...node.data,
                label: values.label,
                stageType: values.stageType,
                stageDefinitionId: values.stageDefinitionId,
                icon: values.icon,
                aiAgentId: values.aiAgentId,
                qaBankId: values.qaBankId,
                assigneeEmail: values.assigneeEmail,
                description: values.description,
                durationMinutes: values.durationMinutes,
                passRule: values.passRule ?? null,
              },
            }
          : node
      )
    );
    setSavedMessage(null);
  };

  const handleAtsCheckSave = (label: string): void => {
    if (!editingAtsId) {
      return;
    }
    const ats = stageCatalog.find((s) => s.stageType === "ats" || s.code === "ats");
    setNodes((current) =>
      current.map((node) =>
        node.id === editingAtsId
          ? {
              ...node,
              data: {
                ...node.data,
                label,
                stageDefinitionId: ats?.id ?? node.data.stageDefinitionId,
                icon: ats?.icon ?? node.data.icon ?? "file-search",
              },
            }
          : node
      )
    );
    setSavedMessage(null);
  };

  const handleSave = (): void => {
    if (!canEdit) {
      return;
    }

    onSave({
      nodes: nodes.map((node) => {
        const kind = normalizeNodeType(node.type);
        const width =
          typeof node.style?.width === "number"
            ? node.style.width
            : typeof node.width === "number"
              ? node.width
              : undefined;
        const height =
          typeof node.style?.height === "number"
            ? node.style.height
            : typeof node.height === "number"
              ? node.height
              : undefined;

        return {
          id: node.id,
          type: kind,
          position: node.position,
          style: {
            ...(width ? { width } : {}),
            ...(height ? { height } : {}),
          },
          data: toPersistedData(kind, node.data as WorkflowNodeData),
        };
      }),
      edges: edges.map((edge) => {
        const looksLikeUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            edge.id
          );
        return {
          id: looksLikeUuid ? edge.id : crypto.randomUUID(),
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? null,
          targetHandle: edge.targetHandle ?? null,
        };
      }),
    });
    setSavedMessage("Workflow saved.");
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white/80 px-4 py-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-xl"
            onClick={onBack}
            aria-label="Back"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {workflow.name}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dropError ? <p className="text-sm font-medium text-rose-600">{dropError}</p> : null}
          {savedMessage ? <p className="text-sm font-medium text-emerald-600">{savedMessage}</p> : null}
          <Button disabled={!canEdit} size="sm" className="rounded-xl" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-[#f5f6f8] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_30px_rgba(15,23,42,0.04)]"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Compact components strip inside the viewer */}
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex justify-center sm:justify-start">
          <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.1)] backdrop-blur">
            {selectedEdgeId && canEdit ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="mr-1 h-8 w-8 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={removeSelectedEdge}
                title="Delete connection"
                aria-label="Delete connection"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
            <button
              type="button"
              title="Add Stage"
              draggable={canEdit}
              disabled={!canEdit}
              onDragStart={onPaletteDragStart}
              onClick={addStageFromPalette}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left transition",
                canEdit
                  ? "cursor-grab hover:bg-slate-100 active:cursor-grabbing"
                  : "cursor-not-allowed opacity-40"
              )}
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-sky-500 text-white">
                <CirclePlus className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-slate-800">Add Stage</span>
            </button>
          </div>
        </div>

        <ReactFlow
          nodes={decoratedNodes}
          edges={displayEdges}
          onNodesChange={canEdit ? onNodesChange : undefined}
          onEdgesChange={canEdit ? onEdgesChange : undefined}
          onConnect={onConnect}
          onInit={(instance: ReactFlowInstance) => {
            setReactFlowInstance(instance);
            // Center Start + Stage at zoom 1 so the start dot is not clipped
            requestAnimationFrame(() => {
              instance.fitView({ padding: 0.35, maxZoom: 1, minZoom: 1 });
            });
          }}
          onEdgeClick={(_, edge) => {
            if (!canEdit) {
              return;
            }
            setSelectedEdgeId(edge.id);
          }}
          onPaneClick={() => setSelectedEdgeId(null)}
          onNodeClick={() => setSelectedEdgeId(null)}
          onNodeDoubleClick={(_, node) => {
            if (!canEdit) {
              return;
            }
            const kind = normalizeNodeType(node.type);
            if (kind === "stage") {
              openEditStage(node.id);
            } else if (kind === "atsCheck") {
              openEditAtsCheck(node.id);
            }
          }}
          onEdgesDelete={(deleted) => {
            if (deleted.some((edge) => {
              const source = nodes.find((node) => node.id === edge.source);
              return source && normalizeNodeType(source.type) === "start";
            })) {
              markStartDisconnected(true);
            }
            setSelectedEdgeId(null);
          }}
          nodeTypes={workflowNodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.15}
          maxZoom={1.5}
          nodesDraggable={canEdit}
          nodesConnectable={canEdit}
          elementsSelectable={canEdit}
          edgesFocusable={canEdit}
          deleteKeyCode={canEdit ? ["Backspace", "Delete"] : null}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            id="dots"
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.4}
            color="#d0d5dd"
          />
          <Controls
            position="bottom-left"
            className="!m-3 !overflow-hidden !rounded-2xl !border !border-slate-200 !bg-white/95 !shadow-lg"
          />
        </ReactFlow>
      </div>

      <EditStageDialog
        open={Boolean(editingNode)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingStageId(null);
          }
        }}
        initial={editingNode ? (editingNode.data as WorkflowNodeData) : null}
        catalog={stageCatalog}
        aiAgents={aiAgents}
        qaBanks={qaBanks}
        onSave={handleStageSave}
        onDelete={() => {
          if (editingStageId) {
            deleteRemovableNode(editingStageId);
          }
        }}
      />

      <EditAtsCheckDialog
        open={Boolean(editingAtsNode)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAtsId(null);
          }
        }}
        initial={editingAtsNode ? (editingAtsNode.data as WorkflowNodeData) : null}
        onSave={handleAtsCheckSave}
        onDelete={() => {
          if (editingAtsId) {
            deleteRemovableNode(editingAtsId);
          }
        }}
      />
    </div>
  );
};
