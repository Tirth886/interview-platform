import type { CurrencyCode } from "./common";

export type SettingsTab =
  | "general"
  | "master-data"
  | "ai-agent"
  | "qa"
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

export type StageType = "ai" | "human" | "qa";

export type StageTemplate = {
  id: string;
  name: string;
  type: StageType;
  colorHex: string;
  durationMinutes: number | null;
  instructions: string;
  createdAt: string;
  /** Present when loaded from API */
  stageType?: string;
  isEnabled?: boolean;
  isSystem?: boolean;
  code?: string;
  /** Lucide icon key from platform catalog, e.g. file-search */
  icon?: string;
  updatedAt?: string;
};

export type WorkflowStageAssignment = {
  id?: string;
  /** stage_definitions.id */
  stageId: string;
  name?: string;
  code?: string;
  conductor?: StageType;
  aiAgentId?: string;
  nodeId?: string;
  orderIndex?: number;
  isEnabled?: boolean;
  config?: Record<string, unknown>;
};

export type WorkflowNodeKind = "start" | "stage" | "condition" | "atsCheck" | "end";

export type StagePassRule =
  | { type: "score"; minScorePercent: number }
  | { type: "manual"; approverRole: "recruiter" | "interviewer" | "admin" };

export type WorkflowNodeData = {
  label: string;
  kind?: WorkflowNodeKind;
  /** Start node: user removed the default outgoing link */
  disconnected?: boolean;
  /** Bound platform stage_definitions.id (type) */
  stageDefinitionId?: string;
  /** Unique slug for this workflow stage */
  stageCode?: string;
  /** Lucide icon key from catalog */
  icon?: string;
  /** Conductor: AI, Human, or Q&A */
  stageType?: StageType;
  aiAgentId?: string;
  qaBankId?: string;
  assigneeEmail?: string;
  /** Shown to the candidate on the schedule page */
  description?: string;
  /** Default interview length when the candidate self-schedules */
  durationMinutes?: number;
  /** Pass/fail rule for this workflow stage (replaces Condition node) */
  passRule?: StagePassRule | null;
};

export type WorkflowFlowNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  style?: {
    width?: number;
    height?: number;
  };
  width?: number;
  height?: number;
};

export type WorkflowFlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type HiringWorkflow = {
  id: string;
  name: string;
  designationId: string;
  stages: WorkflowStageAssignment[];
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  /** Mandatory job description file metadata (local disk now, S3 later) */
  jobDescriptionFileName: string;
  jobDescriptionUrl: string;
  jobDescriptionKey: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkflowPayload = {
  name: string;
  jobDescriptionFileName: string;
  jobDescriptionUrl: string;
  jobDescriptionKey: string;
};

/** @deprecated Use HiringWorkflow */
export type DesignationWorkflow = HiringWorkflow;

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
  isEnabled?: boolean;
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
  workflows: HiringWorkflow[];
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
