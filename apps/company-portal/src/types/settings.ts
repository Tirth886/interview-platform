import type { CurrencyCode } from "./common";

export type SettingsTab =
  | "general"
  | "master-data"
  | "ai-agent"
  | "hiring-workflow"
  | "team"
  | "billing";

export type MasterDataSection =
  | "departments"
  | "designations"
  | "branches"
  | "payScale"
  | "stages";

export type GeneralSettings = {
  companyName: string;
  logoUrl: string;
  timezone: string;
  defaultInterviewDurationMinutes: number;
  defaultHiringFlow: string;
};

export type NamedMasterDataItem = {
  id: string;
  name: string;
  createdAt: string;
};

export type PayScaleRule = {
  id: string;
  minExperienceYears: number;
  maxExperienceYears: number;
  minSalary: number;
  maxSalary: number;
  currency: CurrencyCode;
  createdAt: string;
};

export type StageType = "ai" | "human";

export type StageTemplate = {
  id: string;
  name: string;
  type: StageType;
  colorHex: string;
  durationMinutes: number | null;
  instructions: string;
  createdAt: string;
};

export type WorkflowStageAssignment = {
  stageId: string;
  aiAgentId?: string;
};

export type DesignationWorkflow = {
  id: string;
  designationId: string;
  stages: WorkflowStageAssignment[];
  updatedAt: string;
};

export type TransitionRule =
  | { type: "score"; minScorePercent: number }
  | { type: "manual"; approverRole: "recruiter" | "interviewer" | "admin" };

export type StageTransitionRule = {
  stageId: string;
  rule: TransitionRule;
  updatedAt: string;
};

export type TeamRole = "admin" | "recruiter" | "interviewer";

export type TeamMember = {
  id: string;
  email: string;
  role: TeamRole;
  status: "invited" | "active";
  invitedAt: string;
};

export type BillingSettings = {
  planName: string;
  seatsUsed: number;
  seatsLimit: number;
  renewalDate: string;
};

export type AiAgentConfig = {
  id: string;
  name: string;
  contextMarkdown: string;
  createdAt: string;
  updatedAt: string;
};

export type SettingsState = {
  general: GeneralSettings;
  masterData: {
    departments: NamedMasterDataItem[];
    designations: NamedMasterDataItem[];
    branches: NamedMasterDataItem[];
    payScales: PayScaleRule[];
    stages: StageTemplate[];
  };
  workflows: DesignationWorkflow[];
  transitionRules: StageTransitionRule[];
  aiAgents: AiAgentConfig[];
  teamMembers: TeamMember[];
  billing: BillingSettings;
};

export type NamedMasterKey = "departments" | "designations" | "branches";

export type RuleType = "none" | "score" | "manual";

export type StageForm = {
  name: string;
  type: StageType;
  colorHex: string;
  durationMinutes: string;
  instructions: string;
  ruleType: RuleType;
  minScorePercent: number;
  approverRole: "recruiter" | "interviewer" | "admin";
};

export type AiAgentForm = {
  name: string;
  contextMarkdown: string;
};

export type PayScaleForm = {
  minExperienceYears: string;
  maxExperienceYears: string;
  minSalary: string;
  maxSalary: string;
  currency: CurrencyCode;
};
