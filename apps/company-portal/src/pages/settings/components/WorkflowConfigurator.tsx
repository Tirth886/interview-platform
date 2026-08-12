import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import { getDefaultStageColor } from "../../../utils/jobUtils";
import { moveItem } from "../../../utils/utils";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import type { StageTemplate, WorkflowStageAssignment } from "../../../types/settings";

export const WorkflowConfigurator = ({ canEdit }: { canEdit: boolean }): JSX.Element => {
  const designations = useSettingsStore((state) => state.masterData.designations ?? []);
  const stages = useSettingsStore((state) => state.masterData.stages ?? []);
  const workflows = useSettingsStore((state) => state.workflows ?? []);
  const aiAgents = useSettingsStore((state) => state.aiAgents ?? []);
  const saveWorkflowForDesignation = useSettingsStore((state) => state.saveWorkflowForDesignation);

  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [stageSequence, setStageSequence] = useState<WorkflowStageAssignment[]>([]);
  const [stageToAdd, setStageToAdd] = useState("");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedDesignationId) {
      setStageSequence([]);
      setSavedMsg(null);
      return;
    }
    const workflow = workflows.find((item) => item.designationId === selectedDesignationId);
    setStageSequence(workflow?.stages ?? []);
    setSavedMsg(null);
  }, [selectedDesignationId, workflows]);

  const aiAgentMap = useMemo(
    () => new Map(aiAgents.map((agent) => [agent.id, agent.name])),
    [aiAgents]
  );

  const stageMap = useMemo(
    () => new Map(stages.map((stage) => [stage.id, stage])),
    [stages]
  );

  const sequenceStages = stageSequence
    .map((item) => {
      const stage = stageMap.get(item.stageId);
      return stage ? { assignment: item, stage } : null;
    })
    .filter(
      (item): item is { assignment: WorkflowStageAssignment; stage: StageTemplate } => Boolean(item)
    );

  const selectedDesignationName =
    designations.find((item) => item.id === selectedDesignationId)?.name ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Configuration</CardTitle>
        <CardDescription>
          Configure ordered stage workflow per designation using Stage Master.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {designations.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            Add designations in Master Data before configuring workflows.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-w-sm space-y-1.5">
              <label className="text-sm font-medium">Designation</label>
              <Select value={selectedDesignationId} onValueChange={setSelectedDesignationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((designation) => (
                    <SelectItem key={designation.id} value={designation.id}>
                      {designation.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDesignationId && (
              <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
                <div className="space-y-3 rounded-md border border-border p-3">
                  <p className="text-sm font-semibold text-foreground">Add Stage from Master</p>
                  {stages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stages available.</p>
                  ) : (
                    <>
                      <Select value={stageToAdd} onValueChange={setStageToAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: stage.colorHex ?? getDefaultStageColor(stage.type) }}
                                />
                                {stage.name} ({stage.type.toUpperCase()})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        className="w-full"
                        disabled={!canEdit || !stageToAdd}
                        onClick={() => {
                          setStageSequence((prev) => [...prev, { stageId: stageToAdd }]);
                          setStageToAdd("");
                        }}
                      >
                        Add to Workflow
                      </Button>
                    </>
                  )}
                </div>

                <div className="space-y-3 rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Stage Order for {selectedDesignationName}
                    </p>
                    <Button
                      size="sm"
                      disabled={!canEdit || !selectedDesignationId}
                      onClick={() => {
                        saveWorkflowForDesignation(selectedDesignationId, stageSequence);
                        setSavedMsg("Workflow saved");
                      }}
                    >
                      Save Workflow
                    </Button>
                  </div>

                  {savedMsg && <p className="text-sm text-emerald-700">{savedMsg}</p>}

                  {sequenceStages.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
                      No stages in this workflow yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sequenceStages.map(({ stage, assignment }, index) => (
                        <div
                          key={`${stage.id}-${index}`}
                          className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex-1">
                            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: stage.colorHex ?? getDefaultStageColor(stage.type) }}
                              />
                              {index + 1}. {stage.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stage.type.toUpperCase()} · {stage.durationMinutes ?? "No duration"}
                              {stage.durationMinutes ? " mins" : ""}
                            </p>
                            {stage.type === "ai" && (
                              <div className="mt-2 max-w-64">
                                <Select
                                  value={assignment.aiAgentId ?? "none"}
                                  onValueChange={(value) =>
                                    setStageSequence((prev) =>
                                      prev.map((item, itemIndex) =>
                                        itemIndex === index
                                          ? {
                                              ...item,
                                              aiAgentId: value === "none" ? undefined : value,
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  disabled={!canEdit}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select AI Agent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No agent</SelectItem>
                                    {aiAgents.map((agent) => (
                                      <SelectItem key={agent.id} value={agent.id}>
                                        {agent.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {stage.type === "ai" && assignment.aiAgentId && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Agent: {aiAgentMap.get(assignment.aiAgentId) ?? "Unknown agent"}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canEdit || index === 0}
                              onClick={() =>
                                setStageSequence((prev) => moveItem(prev, index, index - 1))
                              }
                            >
                              Up
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!canEdit || index === sequenceStages.length - 1}
                              onClick={() =>
                                setStageSequence((prev) => moveItem(prev, index, index + 1))
                              }
                            >
                              Down
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={!canEdit}
                              onClick={() =>
                                setStageSequence((prev) => prev.filter((_, i) => i !== index))
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
