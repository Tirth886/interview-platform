import { type Dispatch, type SetStateAction } from "react";
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
import type { JobWorkflowStage, JobFormState, JobFormStep } from "../../../types/jobs";
import type { StageTemplate, TransitionRule } from "../../../types/settings";
import { jobFormSteps } from "../../../constants/jobs";
import { createLocalId, getDefaultStageColor, toRuleLabel } from "../../../utils/jobUtils";

type JobFormMasterData = {
  departments: { id: string; name: string }[];
  designations: { id: string; name: string }[];
  stages: StageTemplate[];
  payScales: {
    minExperienceYears: number;
    maxExperienceYears: number;
    minSalary: number;
    maxSalary: number;
    currency: "USD" | "INR";
  }[];
};

type JobFormSectionProps = {
  mode: "create" | "edit";
  form: JobFormState;
  setForm: Dispatch<SetStateAction<JobFormState>>;
  activeStep: JobFormStep;
  setActiveStep: Dispatch<SetStateAction<JobFormStep>>;
  skillInput: string;
  setSkillInput: Dispatch<SetStateAction<string>>;
  atsInput: string;
  setAtsInput: Dispatch<SetStateAction<string>>;
  stageToAdd: string;
  setStageToAdd: Dispatch<SetStateAction<string>>;
  formError: string | null;
  setFormError: (value: string | null) => void;
  masterData: JobFormMasterData;
  aiAgents: { id: string; name: string }[];
  stageTemplateMap: Map<string, StageTemplate>;
  transitionRuleMap: Map<string, TransitionRule>;
  aiAgentMap: Map<string, string>;
  applyWorkflowForDesignation: (designationId: string) => JobWorkflowStage[];
  tryAutoFillSalary: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  saveJob: () => void;
  onCancel: () => void;
};

export const JobFormSection = ({
  mode,
  form,
  setForm,
  activeStep,
  setActiveStep,
  skillInput,
  setSkillInput,
  atsInput,
  setAtsInput,
  stageToAdd,
  setStageToAdd,
  formError,
  setFormError,
  masterData,
  aiAgents,
  stageTemplateMap,
  transitionRuleMap,
  aiAgentMap,
  applyWorkflowForDesignation,
  tryAutoFillSalary,
  goToNextStep,
  goToPreviousStep,
  saveJob,
  onCancel,
}: JobFormSectionProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Job" : "Edit Job"}</CardTitle>
        <CardDescription>
          Designation selection auto-applies predefined workflow and stage rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {jobFormSteps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                activeStep === step.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Step {step.id}: {step.label}
            </button>
          ))}
        </div>

        {activeStep === 1 && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Department</label>
                <Select
                  value={form.departmentId}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {masterData.departments.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Designation</label>
                <Select
                  value={form.designationId}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      designationId: value,
                      workflowStages: applyWorkflowForDesignation(value),
                    }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {masterData.designations.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Skills and ATS keywords are configured in the next two steps.
            </p>
          </>
        )}

        {activeStep === 2 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Skills (Job-wise)</label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                placeholder="e.g. React, Node.js"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const keyword = skillInput.trim();
                  if (!keyword) return;
                  setForm((prev) => {
                    const exists = prev.skillKeywords.some(
                      (k) => k.toLowerCase() === keyword.toLowerCase()
                    );
                    if (exists) return prev;
                    return { ...prev, skillKeywords: [...prev.skillKeywords, keyword] };
                  });
                  setSkillInput("");
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 rounded-md border border-input p-2">
              {form.skillKeywords.length === 0 ? (
                <span className="text-xs text-muted-foreground">No skills added yet</span>
              ) : (
                form.skillKeywords.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        skillKeywords: prev.skillKeywords.filter((k) => k !== skill),
                      }))
                    }
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                  >
                    {skill} ×
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ATS Keywords</label>
            <div className="flex gap-2">
              <Input
                value={atsInput}
                onChange={(event) => setAtsInput(event.target.value)}
                placeholder="e.g. TypeScript, Microservices"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const keyword = atsInput.trim();
                  if (!keyword) return;
                  setForm((prev) => {
                    const exists = prev.atsKeywords.some(
                      (k) => k.toLowerCase() === keyword.toLowerCase()
                    );
                    if (exists) return prev;
                    return { ...prev, atsKeywords: [...prev.atsKeywords, keyword] };
                  });
                  setAtsInput("");
                }}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 rounded-md border border-input p-2">
              {form.atsKeywords.length === 0 ? (
                <span className="text-xs text-muted-foreground">No ATS keywords set</span>
              ) : (
                form.atsKeywords.map((keyword) => (
                  <button
                    type="button"
                    key={keyword}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        atsKeywords: prev.atsKeywords.filter((k) => k !== keyword),
                      }))
                    }
                    className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground"
                  >
                    {keyword} ×
                  </button>
                ))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              ATS match is calculated against candidate profile keywords.
            </p>
            <div className="space-y-1.5 pt-2">
              <label className="text-sm font-medium">Expected ATS Score (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.expectedAtsScore}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, expectedAtsScore: event.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Candidates at or above this score are considered a strong ATS fit.
              </p>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Experience Min</label>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceMinYears}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, experienceMinYears: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Experience Max</label>
                <Input
                  type="number"
                  min={0}
                  value={form.experienceMaxYears}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, experienceMaxYears: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salary Min</label>
                <Input
                  type="number"
                  min={0}
                  value={form.salaryMin}
                  onChange={(event) => setForm((prev) => ({ ...prev, salaryMin: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Salary Max</label>
                <Input
                  type="number"
                  min={0}
                  value={form.salaryMax}
                  onChange={(event) => setForm((prev) => ({ ...prev, salaryMax: event.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={form.salaryCurrency}
                onValueChange={(value: "USD" | "INR") =>
                  setForm((prev) => ({ ...prev, salaryCurrency: value }))
                }
              >
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="INR">INR</SelectItem>
                </SelectContent>
              </Select>

              <Button type="button" variant="outline" onClick={tryAutoFillSalary}>
                Auto-fill via PayScale
              </Button>
            </div>
          </>
        )}

        {activeStep === 5 && (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Workflow Preview</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={!form.designationId}
                  onClick={() => {
                    if (!form.designationId) return;
                    setForm((prev) => ({
                      ...prev,
                      workflowStages: applyWorkflowForDesignation(prev.designationId),
                    }));
                    setFormError(null);
                  }}
                >
                  Auto-fill from Designation
                </Button>
                <Select value={stageToAdd} onValueChange={setStageToAdd}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Add stage" /></SelectTrigger>
                  <SelectContent>
                    {masterData.stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!stageToAdd}
                  onClick={() => {
                    const stage = stageTemplateMap.get(stageToAdd);
                    if (!stage) return;
                    setForm((prev) => ({
                      ...prev,
                      workflowStages: [
                        ...prev.workflowStages,
                        {
                          id: createLocalId(),
                          stageTemplateId: stage.id,
                          aiAgentId: undefined,
                          name: stage.name,
                          type: stage.type,
                          colorHex: stage.colorHex ?? getDefaultStageColor(stage.type),
                          durationMinutes: stage.durationMinutes,
                          transitionRule: transitionRuleMap.get(stage.id),
                        },
                      ],
                    }));
                    setStageToAdd("");
                  }}
                >
                  Add Stage
                </Button>
              </div>
            </div>

            {form.workflowStages.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-5 text-sm text-muted-foreground">
                No stages in workflow. Select a designation and click "Auto-fill from Designation".
              </div>
            ) : (
              <div className="space-y-2">
                {form.workflowStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.colorHex }} />
                        {index + 1}. {stage.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stage.type.toUpperCase()} · {toRuleLabel(stage.transitionRule)}
                      </p>
                      {stage.type === "ai" && (
                        <div className="mt-2 max-w-56">
                          <Select
                            value={stage.aiAgentId ?? "none"}
                            onValueChange={(value) =>
                              setForm((prev) => ({
                                ...prev,
                                workflowStages: prev.workflowStages.map((item) =>
                                  item.id === stage.id
                                    ? { ...item, aiAgentId: value === "none" ? undefined : value }
                                    : item
                                ),
                              }))
                            }
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
                      {stage.type === "ai" && stage.aiAgentId && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Agent: {aiAgentMap.get(stage.aiAgentId) ?? "Unknown agent"}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          workflowStages: prev.workflowStages.filter((s) => s.id !== stage.id),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeStep === 6 && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-semibold">Review</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Title</p>
                <p className="text-sm font-medium">{form.title || "-"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{form.location || "-"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Skills</p>
                <p className="text-sm font-medium">{form.skillKeywords.join(", ") || "-"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ATS Keywords</p>
                <p className="text-sm font-medium">{form.atsKeywords.join(", ") || "-"}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected ATS Score</p>
                <p className="text-sm font-medium">{form.expectedAtsScore || "0"}%</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
                <p className="text-sm font-medium">
                  {form.experienceMinYears} - {form.experienceMaxYears} years
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
                <p className="text-sm font-medium">
                  {form.salaryMin || "-"} - {form.salaryMax || "-"} {form.salaryCurrency}
                </p>
              </div>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Workflow Stages</p>
              <p className="text-sm font-medium">{form.workflowStages.length} stages configured</p>
              {form.workflowStages.some((stage) => stage.type === "ai" && stage.aiAgentId) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {form.workflowStages
                    .filter((stage) => stage.type === "ai" && stage.aiAgentId)
                    .map((stage) => (
                      <span
                        key={stage.id}
                        className="rounded-full border border-border px-2 py-0.5 text-xs"
                      >
                        {stage.name}: {aiAgentMap.get(stage.aiAgentId ?? "") ?? "Unknown agent"}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={goToPreviousStep} disabled={activeStep === 1}>
            Back
          </Button>
          {activeStep < 6 ? (
            <Button onClick={goToNextStep}>Next</Button>
          ) : (
            <Button onClick={saveJob}>{mode === "create" ? "Create Job" : "Save Changes"}</Button>
          )}
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};
