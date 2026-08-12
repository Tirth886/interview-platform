import type { JobFormState, JobWorkflowStage } from "../types/jobs";
import type { StageType, TransitionRule } from "../types/settings";

export const getDefaultStageColor = (type: StageType): string =>
  type === "ai" ? "#2563EB" : "#D97706";

export const createLocalId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const buildFallbackWorkflow = (
  defaultDuration: number,
  text: string
): JobWorkflowStage[] =>
  text
    .split("->")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({
      id: createLocalId(),
      name,
      type: "human" as const,
      colorHex: getDefaultStageColor("human"),
      durationMinutes: defaultDuration,
    }));

export const toRuleLabel = (rule: TransitionRule | undefined): string => {
  if (!rule) {
    return "No rule";
  }
  if (rule.type === "score") {
    return `Score >= ${rule.minScorePercent}%`;
  }
  return `Manual approval (${rule.approverRole})`;
};

export const emptyJobForm = (
  defaultDuration: number,
  defaultFlowText: string
): JobFormState => ({
  title: "",
  description: "",
  skillKeywords: [],
  atsKeywords: [],
  expectedAtsScore: "70",
  departmentId: "",
  designationId: "",
  experienceMinYears: "0",
  experienceMaxYears: "3",
  location: "",
  salaryMin: "",
  salaryMax: "",
  salaryCurrency: "USD",
  isPublic: true,
  status: "draft",
  workflowStages: buildFallbackWorkflow(defaultDuration, defaultFlowText),
});
