import type {
  AiAgentForm,
  MasterDataSection,
  PayScaleForm,
  SettingsTab,
  StageForm,
  TeamRole,
} from "../types/settings";
import { getDefaultStageColor } from "../utils/jobUtils";

export const settingsTabs: { id: SettingsTab; label: string; description: string }[] = [
  {
    id: "general",
    label: "General Settings",
    description: "Company profile and default interview preferences",
  },
  {
    id: "master-data",
    label: "Master Data",
    description: "Departments, designations, stages, and payscales",
  },
  {
    id: "ai-agent",
    label: "AI Agents",
    description: "Reusable AI agent contexts and rules",
  },
  {
    id: "hiring-workflow",
    label: "Hiring Workflow",
    description: "Designation-based stage workflows",
  },
  {
    id: "team",
    label: "Team Management",
    description: "Invite users and manage roles",
  },
  {
    id: "billing",
    label: "Billing",
    description: "Plan details and invoices",
  },
];

export const masterDataSections: { id: MasterDataSection; label: string }[] = [
  { id: "departments", label: "Departments" },
  { id: "designations", label: "Designations" },
  { id: "branches", label: "Branches" },
  { id: "payScale", label: "PayScale" },
  { id: "stages", label: "Stages" },
];

export const timezoneOptions = ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];
export const teamRoleOptions: TeamRole[] = ["admin", "recruiter", "interviewer"];

export const blankStageForm: StageForm = {
  name: "",
  type: "ai",
  colorHex: getDefaultStageColor("ai"),
  durationMinutes: "",
  instructions: "",
  ruleType: "none",
  minScorePercent: 70,
  approverRole: "recruiter",
};

export const blankAiAgentForm: AiAgentForm = {
  name: "",
  contextMarkdown:
    "# AI Context\n\nDefine the agent rules, constraints, and expected behavior in Markdown.",
};

export const blankPayScaleForm: PayScaleForm = {
  minExperienceYears: "0",
  maxExperienceYears: "1",
  minSalary: "0",
  maxSalary: "0",
  currency: "USD",
};
