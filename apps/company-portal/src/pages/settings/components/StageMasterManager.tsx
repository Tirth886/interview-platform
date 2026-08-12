import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import type { StageForm, StageTemplate, StageType } from "../../../types/settings";
import { blankStageForm } from "../../../constants/settings";
import { getDefaultStageColor } from "../../../utils/jobUtils";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { RuleToggle } from "./RuleToggle";

export const StageMasterManager = ({ canEdit }: { canEdit: boolean }): JSX.Element => {
  const stages = useSettingsStore((state) => state.masterData.stages ?? []);
  const addStageTemplate = useSettingsStore((state) => state.addStageTemplate);
  const updateStageTemplate = useSettingsStore((state) => state.updateStageTemplate);
  const deleteStageTemplate = useSettingsStore((state) => state.deleteStageTemplate);
  const transitionRules = useSettingsStore((state) => state.transitionRules ?? []);
  const setTransitionRule = useSettingsStore((state) => state.setTransitionRule);
  const clearTransitionRule = useSettingsStore((state) => state.clearTransitionRule);

  const ruleMap = useMemo(
    () => new Map(transitionRules.map((item) => [item.stageId, item.rule])),
    [transitionRules]
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<StageForm>(blankStageForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<StageForm>(blankStageForm);

  const applyRule = (stageId: string, form: StageForm): void => {
    if (form.ruleType === "score") {
      setTransitionRule(stageId, { type: "score", minScorePercent: form.minScorePercent });
    } else if (form.ruleType === "manual") {
      setTransitionRule(stageId, { type: "manual", approverRole: form.approverRole });
    } else {
      clearTransitionRule(stageId);
    }
  };

  const startEdit = (stage: StageTemplate): void => {
    const existing = ruleMap.get(stage.id);
    setEditingId(stage.id);
    setEditingStage({
      name: stage.name,
      type: stage.type,
      colorHex: stage.colorHex ?? getDefaultStageColor(stage.type),
      durationMinutes: stage.durationMinutes ? String(stage.durationMinutes) : "",
      instructions: stage.instructions,
      ruleType: existing ? existing.type : "none",
      minScorePercent: existing?.type === "score" ? existing.minScorePercent : 70,
      approverRole: existing?.type === "manual" ? existing.approverRole : "recruiter",
    });
  };

  const saveCreate = (): void => {
    const result = addStageTemplate({
      name: newStage.name,
      type: newStage.type,
      colorHex: newStage.colorHex,
      durationMinutes: newStage.durationMinutes.trim()
        ? Number(newStage.durationMinutes)
        : null,
      instructions: newStage.instructions,
    });
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to create stage");
      return;
    }
    if (newStage.ruleType !== "none") {
      const created = useSettingsStore
        .getState()
        .masterData.stages.find(
          (s) => s.name.toLowerCase() === newStage.name.trim().toLowerCase()
        );
      if (created) {
        applyRule(created.id, newStage);
      }
    }
    setFormError(null);
    setNewStage(blankStageForm);
  };

  const saveEdit = (): void => {
    if (!editingId) {
      return;
    }
    const result = updateStageTemplate(editingId, {
      name: editingStage.name,
      type: editingStage.type,
      colorHex: editingStage.colorHex,
      durationMinutes: editingStage.durationMinutes.trim()
        ? Number(editingStage.durationMinutes)
        : null,
      instructions: editingStage.instructions,
    });
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to update stage");
      return;
    }
    applyRule(editingId, editingStage);
    setFormError(null);
    setEditingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage Master</CardTitle>
        <CardDescription>Create reusable AI/Human stages used in hiring workflows.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-5">
          <Input
            placeholder="Stage name"
            value={newStage.name}
            onChange={(event) => setNewStage((prev) => ({ ...prev, name: event.target.value }))}
            disabled={!canEdit}
          />
          <Select
            value={newStage.type}
            onValueChange={(value: StageType) => setNewStage((prev) => ({ ...prev, type: value }))}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="human">Human</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={0}
            placeholder="Duration (mins) optional"
            value={newStage.durationMinutes}
            onChange={(event) =>
              setNewStage((prev) => ({ ...prev, durationMinutes: event.target.value }))
            }
            disabled={!canEdit}
          />
          <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2">
            <Input
              type="color"
              value={newStage.colorHex}
              onChange={(event) =>
                setNewStage((prev) => ({ ...prev, colorHex: event.target.value }))
              }
              disabled={!canEdit}
              className="h-8 w-10 border-0 p-0"
            />
            <span className="text-xs text-muted-foreground">Color</span>
          </div>
          <Button disabled={!canEdit || !newStage.name.trim()} onClick={saveCreate}>
            Add Stage
          </Button>
        </div>

        <Input
          placeholder="Instructions (optional)"
          value={newStage.instructions}
          onChange={(event) =>
            setNewStage((prev) => ({ ...prev, instructions: event.target.value }))
          }
          disabled={!canEdit}
        />

        <div className="space-y-2 rounded-md border border-dashed border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Passing criteria
          </p>
          <RuleToggle
            value={newStage.ruleType}
            onChange={(v) => setNewStage((prev) => ({ ...prev, ruleType: v }))}
            disabled={!canEdit}
          />
          {newStage.ruleType === "score" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Min score</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newStage.minScorePercent}
                onChange={(event) =>
                  setNewStage((prev) => ({
                    ...prev,
                    minScorePercent: Math.min(100, Math.max(0, Number(event.target.value))),
                  }))
                }
                disabled={!canEdit}
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">% — candidate must reach this score to advance</span>
            </div>
          )}
          {newStage.ruleType === "manual" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Approver</label>
              <Select
                value={newStage.approverRole}
                onValueChange={(value: "recruiter" | "interviewer" | "admin") =>
                  setNewStage((prev) => ({ ...prev, approverRole: value }))
                }
                disabled={!canEdit}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="interviewer">Interviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">must approve to advance</span>
            </div>
          )}
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        {stages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No stages yet. Create stages like AI Interview or Coding Round.
          </div>
        ) : (
          <div className="space-y-2">
            {stages.map((stage) => {
              const isEditing = editingId === stage.id;
              return (
                <div
                  key={stage.id}
                  className="space-y-2 rounded-md border border-border p-3"
                >
                  {isEditing ? (
                    <>
                      <div className="grid gap-2 md:grid-cols-4">
                        <Input
                          value={editingStage.name}
                          onChange={(event) =>
                            setEditingStage((prev) => ({ ...prev, name: event.target.value }))
                          }
                          disabled={!canEdit}
                        />
                        <Select
                          value={editingStage.type}
                          onValueChange={(value: StageType) =>
                            setEditingStage((prev) => ({ ...prev, type: value }))
                          }
                          disabled={!canEdit}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai">AI</SelectItem>
                            <SelectItem value="human">Human</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Duration"
                          value={editingStage.durationMinutes}
                          onChange={(event) =>
                            setEditingStage((prev) => ({
                              ...prev,
                              durationMinutes: event.target.value,
                            }))
                          }
                          disabled={!canEdit}
                        />
                        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-2">
                          <Input
                            type="color"
                            value={editingStage.colorHex}
                            onChange={(event) =>
                              setEditingStage((prev) => ({ ...prev, colorHex: event.target.value }))
                            }
                            disabled={!canEdit}
                            className="h-8 w-10 border-0 p-0"
                          />
                          <span className="text-xs text-muted-foreground">Color</span>
                        </div>
                      </div>
                      <Input
                        value={editingStage.instructions}
                        onChange={(event) =>
                          setEditingStage((prev) => ({
                            ...prev,
                            instructions: event.target.value,
                          }))
                        }
                        placeholder="Instructions"
                        disabled={!canEdit}
                      />
                      <div className="space-y-2 rounded-md border border-dashed border-border p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Passing criteria
                        </p>
                        <RuleToggle
                          value={editingStage.ruleType}
                          onChange={(v) => setEditingStage((prev) => ({ ...prev, ruleType: v }))}
                          disabled={!canEdit}
                        />
                        {editingStage.ruleType === "score" && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Min score</label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={editingStage.minScorePercent}
                              onChange={(event) =>
                                setEditingStage((prev) => ({
                                  ...prev,
                                  minScorePercent: Math.min(100, Math.max(0, Number(event.target.value))),
                                }))
                              }
                              disabled={!canEdit}
                              className="w-20"
                            />
                            <span className="text-xs text-muted-foreground">% — candidate must reach this score to advance</span>
                          </div>
                        )}
                        {editingStage.ruleType === "manual" && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">Approver</label>
                            <Select
                              value={editingStage.approverRole}
                              onValueChange={(value: "recruiter" | "interviewer" | "admin") =>
                                setEditingStage((prev) => ({ ...prev, approverRole: value }))
                              }
                              disabled={!canEdit}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recruiter">Recruiter</SelectItem>
                                <SelectItem value="interviewer">Interviewer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">must approve to advance</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" disabled={!canEdit} onClick={saveEdit}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: stage.colorHex ?? getDefaultStageColor(stage.type) }}
                          />
                          {stage.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stage.type.toUpperCase()} · {stage.durationMinutes ?? "No duration"}
                          {stage.durationMinutes ? " mins" : ""}
                        </p>
                        {stage.instructions && (
                          <p className="text-xs text-muted-foreground">{stage.instructions}</p>
                        )}
                        {(() => {
                          const rule = ruleMap.get(stage.id);
                          if (!rule) {
                            return (
                              <span className="inline-block rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                                No transition rule
                              </span>
                            );
                          }
                          if (rule.type === "score") {
                            return (
                              <span className="inline-block rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                Pass if score ≥ {rule.minScorePercent}%
                              </span>
                            );
                          }
                          return (
                            <span className="inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Requires {rule.approverRole} approval
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => startEdit(stage)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!canEdit}
                          onClick={() => deleteStageTemplate(stage.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
