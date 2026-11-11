import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import type {
  RuleType,
  StagePassRule,
  StageTemplate,
  StageType,
  WorkflowNodeData,
} from "../../../types/settings";
import { getStageIcon } from "../../../utils/stageIcons";
import { RuleToggle } from "./RuleToggle";

export type StageEditValues = {
  label: string;
  stageType: StageType;
  stageDefinitionId: string;
  icon?: string;
  aiAgentId?: string;
  qaBankId?: string;
  assigneeEmail?: string;
  description?: string;
  durationMinutes?: number;
  passRule?: StagePassRule | null;
};

type EditStageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WorkflowNodeData | null;
  catalog: StageTemplate[];
  aiAgents: Array<{ id: string; name: string }>;
  qaBanks: Array<{ id: string; name: string }>;
  onSave: (values: StageEditValues) => void;
  onDelete: () => void;
};

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const conductorButtonClass = (active: boolean, tone: "sky" | "violet" | "emerald"): string => {
  if (!active) {
    return "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:border-slate-300";
  }
  if (tone === "violet") {
    return "rounded-xl border border-violet-400 bg-violet-50 px-3 py-2.5 text-left text-sm font-medium text-violet-900 shadow-sm";
  }
  if (tone === "emerald") {
    return "rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-900 shadow-sm";
  }
  return "rounded-xl border border-sky-400 bg-sky-50 px-3 py-2.5 text-left text-sm font-medium text-sky-900 shadow-sm";
};

export const EditStageDialog = ({
  open,
  onOpenChange,
  initial,
  catalog,
  aiAgents,
  qaBanks,
  onSave,
  onDelete,
}: EditStageDialogProps): JSX.Element => {
  const typeOptions = useMemo(() => catalog.filter((stage) => stage.isEnabled !== false), [catalog]);
  const [stageDefinitionId, setStageDefinitionId] = useState("");
  const [label, setLabel] = useState("");
  const [stageType, setStageType] = useState<StageType>("ai");
  const [aiAgentId, setAiAgentId] = useState<string>("");
  const [qaBankId, setQaBankId] = useState<string>("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [ruleType, setRuleType] = useState<RuleType>("none");
  const [minScorePercent, setMinScorePercent] = useState(70);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !initial) {
      return;
    }

    setStageDefinitionId(initial.stageDefinitionId ?? "");
    setLabel(initial.label ?? "");
    setStageType(initial.stageType ?? "ai");
    setAiAgentId(initial.aiAgentId ?? "");
    setQaBankId(initial.qaBankId ?? "");
    setAssigneeEmail(initial.assigneeEmail ?? "");
    setDescription(initial.description ?? "");
    setDurationMinutes(
      typeof initial.durationMinutes === "number" && initial.durationMinutes >= 15
        ? initial.durationMinutes
        : 45
    );
    const rule = initial.passRule;
    const conductor = initial.stageType ?? "ai";
    if (rule?.type === "score") {
      setRuleType("score");
      setMinScorePercent(rule.minScorePercent);
    } else if (rule?.type === "manual") {
      setRuleType("manual");
      setMinScorePercent(70);
    } else if (conductor === "human") {
      setRuleType("manual");
      setMinScorePercent(70);
    } else {
      setRuleType("none");
      setMinScorePercent(70);
    }
    setError(null);
  }, [open, initial]);

  const selectedType = useMemo(
    () => typeOptions.find((stage) => stage.id === stageDefinitionId) ?? null,
    [typeOptions, stageDefinitionId]
  );

  useEffect(() => {
    if (!open || !initial || typeOptions.length === 0) {
      return;
    }
    if (initial.stageDefinitionId) {
      const exact = typeOptions.find((stage) => stage.id === initial.stageDefinitionId);
      if (exact) {
        setStageDefinitionId(exact.id);
        return;
      }
    }
    const coding = typeOptions.find(
      (stage) => stage.code === "coding_screening" || stage.stageType === "coding"
    );
    if (coding) {
      setStageDefinitionId(coding.id);
    }
  }, [open, initial, typeOptions]);

  const handleTypeChange = (id: string): void => {
    setStageDefinitionId(id);
    const def = typeOptions.find((item) => item.id === id);
    if (def && !label.trim()) {
      setLabel(def.name);
    }
    setError(null);
  };

  const buildPassRule = (): StagePassRule | null => {
    if (ruleType === "score") {
      return { type: "score", minScorePercent };
    }
    if (ruleType === "manual") {
      return { type: "manual", approverRole: "recruiter" };
    }
    return null;
  };

  const handleSave = (): void => {
    if (!stageDefinitionId) {
      setError("Pick a stage type.");
      return;
    }

    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setError("Stage name is required.");
      return;
    }

    const def = typeOptions.find((item) => item.id === stageDefinitionId);
    const passRule = buildPassRule();

    if (stageType === "human") {
      const email = assigneeEmail.trim();
      if (!email) {
        setError("Add an email for the human interviewer.");
        return;
      }
      if (!isValidEmail(email)) {
        setError("Enter a valid email address.");
        return;
      }
      onSave({
        label: cleanLabel,
        stageType: "human",
        stageDefinitionId,
        icon: def?.icon,
        assigneeEmail: email.toLowerCase(),
        aiAgentId: undefined,
        qaBankId: undefined,
        description: description.trim() || undefined,
        durationMinutes,
        passRule,
      });
      onOpenChange(false);
      return;
    }

    if (stageType === "qa") {
      if (!qaBankId) {
        setError("Pick a Q&A bank.");
        return;
      }
      onSave({
        label: cleanLabel,
        stageType: "qa",
        stageDefinitionId,
        icon: def?.icon,
        qaBankId,
        aiAgentId: undefined,
        assigneeEmail: undefined,
        description: description.trim() || undefined,
        durationMinutes,
        passRule,
      });
      onOpenChange(false);
      return;
    }

    onSave({
      label: cleanLabel,
      stageType: "ai",
      stageDefinitionId,
      icon: def?.icon,
      aiAgentId: aiAgentId || undefined,
      qaBankId: undefined,
      assigneeEmail: undefined,
      description: description.trim() || undefined,
      durationMinutes,
      passRule,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
          <DialogDescription>
            Set this workflow stage name, description, conductor, and pass rule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="stage-name">Stage name</Label>
            <Input
              id="stage-name"
              value={label}
              placeholder="e.g. Technical Coding"
              onChange={(event) => {
                setLabel(event.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-description">Stage description</Label>
            <textarea
              id="stage-description"
              value={description}
              rows={3}
              placeholder="What the candidate should expect in this stage…"
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Shown on the candidate schedule page when they pick a date and time.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage-duration">Default duration (minutes)</Label>
            <Input
              id="stage-duration"
              type="number"
              min={15}
              max={360}
              value={durationMinutes}
              onChange={(event) => {
                setDurationMinutes(Math.min(360, Math.max(15, Number(event.target.value) || 45)));
                setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              key={`stage-type-${selectedType?.id ?? "none"}-${typeOptions.length}`}
              value={selectedType?.id}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger className="[&>span]:!line-clamp-none [&>span]:flex [&>span]:min-w-0 [&>span]:flex-1 [&>span]:items-center [&>span]:gap-2 [&>span]:overflow-hidden">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((stage) => {
                  const Icon = getStageIcon(stage.icon);
                  return (
                    <SelectItem key={stage.id} value={stage.id} textValue={stage.name}>
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{stage.name}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Conductor</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStageType("ai");
                  setError(null);
                }}
                className={conductorButtonClass(stageType === "ai", "sky")}
              >
                AI
              </button>
              <button
                type="button"
                onClick={() => {
                  setStageType("human");
                  setRuleType("manual");
                  setError(null);
                }}
                className={conductorButtonClass(stageType === "human", "violet")}
              >
                Human
              </button>
              <button
                type="button"
                onClick={() => {
                  setStageType("qa");
                  setError(null);
                }}
                className={conductorButtonClass(stageType === "qa", "emerald")}
              >
                Q&A
              </button>
            </div>
          </div>

          {stageType === "ai" ? (
            <div className="space-y-2">
              <Label>AI agent</Label>
              <Select
                value={aiAgentId || "none"}
                onValueChange={(value) => setAiAgentId(value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No agent selected</SelectItem>
                  {aiAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {stageType === "human" ? (
            <div className="space-y-2">
              <Label htmlFor="assignee-email">Interviewer email</Label>
              <Input
                id="assignee-email"
                type="email"
                autoComplete="email"
                placeholder="interviewer@company.com"
                value={assigneeEmail}
                onChange={(event) => {
                  setAssigneeEmail(event.target.value);
                  setError(null);
                }}
              />
            </div>
          ) : null}

          {stageType === "qa" ? (
            <div className="space-y-2">
              <Label>Q&A bank</Label>
              <Select
                value={qaBankId || undefined}
                onValueChange={(value) => {
                  setQaBankId(value);
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Q&A bank" />
                </SelectTrigger>
                <SelectContent>
                  {qaBanks.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No Q&A banks yet
                    </SelectItem>
                  ) : (
                    qaBanks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border bg-muted p-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Pass rule
            </p>
            <RuleToggle value={ruleType} onChange={setRuleType} disabled={false} />
            {ruleType === "score" ? (
              <div className="flex items-center gap-2">
                <label className="whitespace-nowrap text-xs text-muted-foreground">Min score</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={minScorePercent}
                  onChange={(event) =>
                    setMinScorePercent(
                      Math.min(100, Math.max(0, Number(event.target.value) || 0))
                    )
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            Remove stage
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
