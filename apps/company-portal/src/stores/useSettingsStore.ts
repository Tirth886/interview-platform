import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AiAgentConfig,
  BillingSettings,
  DesignationWorkflow,
  GeneralSettings,
  NamedMasterDataItem,
  NamedMasterKey,
  PayScaleRule,
  SettingsState,
  StageTemplate,
  StageTransitionRule,
  StageType,
  TeamMember,
  TeamRole,
  TransitionRule,
  WorkflowStageAssignment,
} from "../types/settings";

const SETTINGS_STORAGE_KEY = "company-portal.settings";

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const nowIso = (): string => new Date().toISOString();

const STAGE_COLOR_HEX = /^#[0-9a-fA-F]{6}$/;

const getDefaultStageColor = (type: StageType): string =>
  type === "ai" ? "#2563EB" : "#D97706";

const normalizeStageColor = (value: string | undefined, type: StageType): string => {
  if (!value) {
    return getDefaultStageColor(type);
  }
  return STAGE_COLOR_HEX.test(value) ? value : getDefaultStageColor(type);
};

const initialGeneral: GeneralSettings = {
  companyName: "",
  logoUrl: "",
  timezone: "UTC",
  defaultInterviewDurationMinutes: 45,
  defaultHiringFlow: "Screening -> Technical -> Managerial -> Offer",
};

const initialBilling: BillingSettings = {
  planName: "Growth",
  seatsUsed: 6,
  seatsLimit: 10,
  renewalDate: "2026-06-01",
};

const initialMasterData = {
  departments: [] as NamedMasterDataItem[],
  designations: [] as NamedMasterDataItem[],
  branches: [] as NamedMasterDataItem[],
  payScales: [] as PayScaleRule[],
  stages: [] as StageTemplate[],
};

type SettingsStore = SettingsState & {
  seedDemoData: () => void;
  updateGeneral: (updates: Partial<GeneralSettings>) => void;
  addNamedMasterItem: (key: NamedMasterKey, name: string) => void;
  updateNamedMasterItem: (key: NamedMasterKey, id: string, name: string) => void;
  deleteNamedMasterItem: (key: NamedMasterKey, id: string) => void;
  setTransitionRule: (stageId: string, rule: TransitionRule) => void;
  clearTransitionRule: (stageId: string) => void;
  addStageTemplate: (payload: {
    name: string;
    type: StageType;
    colorHex: string;
    durationMinutes: number | null;
    instructions: string;
  }) => { ok: boolean; reason?: string };
  updateStageTemplate: (
    id: string,
    payload: {
      name: string;
      type: StageType;
      colorHex: string;
      durationMinutes: number | null;
      instructions: string;
    }
  ) => { ok: boolean; reason?: string };
  deleteStageTemplate: (id: string) => void;
  saveWorkflowForDesignation: (designationId: string, stages: WorkflowStageAssignment[]) => void;
  addPayScale: (rule: Omit<PayScaleRule, "id" | "createdAt">) => void;
  updatePayScale: (id: string, updates: Omit<PayScaleRule, "id" | "createdAt">) => void;
  deletePayScale: (id: string) => void;
  addAiAgent: (payload: { name: string; contextMarkdown: string }) => { ok: boolean; reason?: string };
  updateAiAgent: (
    id: string,
    payload: { name: string; contextMarkdown: string }
  ) => { ok: boolean; reason?: string };
  deleteAiAgent: (id: string) => void;
  addTeamMember: (email: string, role: TeamRole) => { ok: boolean; reason?: string };
  updateTeamMemberRole: (id: string, role: TeamRole) => void;
  removeTeamMember: (id: string) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      general: initialGeneral,
      masterData: initialMasterData,
      workflows: [] as DesignationWorkflow[],
      transitionRules: [] as StageTransitionRule[],
      aiAgents: [] as AiAgentConfig[],
      teamMembers: [] as TeamMember[],
      billing: initialBilling,

      seedDemoData: () =>
        set((state) => {
          const demoCreatedAt = "2026-04-04T09:00:00.000Z";

          const cleanedMasterData = {
            departments: state.masterData.departments.filter((item) => !item.id.startsWith("demo-")),
            designations: state.masterData.designations.filter((item) => !item.id.startsWith("demo-")),
            branches: state.masterData.branches.filter((item) => !item.id.startsWith("demo-")),
            payScales: state.masterData.payScales.filter((item) => !item.id.startsWith("demo-")),
          };

          const demoDepartments: NamedMasterDataItem[] = [
            { id: "demo-dept-eng", name: "Engineering", createdAt: demoCreatedAt },
            { id: "demo-dept-prod", name: "Product", createdAt: demoCreatedAt },
            { id: "demo-dept-data", name: "Data Science", createdAt: demoCreatedAt },
          ];

          const demoDesignations: NamedMasterDataItem[] = [
            { id: "demo-desig-fe", name: "Senior Frontend Engineer", createdAt: demoCreatedAt },
            { id: "demo-desig-be", name: "Backend Engineer", createdAt: demoCreatedAt },
            { id: "demo-desig-pm", name: "Product Manager", createdAt: demoCreatedAt },
          ];

          const demoBranches: NamedMasterDataItem[] = [
            { id: "demo-branch-remote", name: "Remote", createdAt: demoCreatedAt },
            { id: "demo-branch-ny", name: "New York", createdAt: demoCreatedAt },
            { id: "demo-branch-blr", name: "Bangalore", createdAt: demoCreatedAt },
          ];

          const demoPayScales: PayScaleRule[] = [
            {
              id: "demo-pay-0-2",
              minExperienceYears: 0,
              maxExperienceYears: 2,
              minSalary: 55000,
              maxSalary: 80000,
              currency: "USD",
              createdAt: demoCreatedAt,
            },
            {
              id: "demo-pay-3-5",
              minExperienceYears: 3,
              maxExperienceYears: 5,
              minSalary: 80000,
              maxSalary: 120000,
              currency: "USD",
              createdAt: demoCreatedAt,
            },
            {
              id: "demo-pay-6-10",
              minExperienceYears: 6,
              maxExperienceYears: 10,
              minSalary: 120000,
              maxSalary: 170000,
              currency: "USD",
              createdAt: demoCreatedAt,
            },
          ];

          const demoTeamMembers: TeamMember[] = [
            {
              id: "demo-team-recruiter",
              email: "recruiter@acmetalent.ai",
              role: "recruiter",
              status: "active",
              invitedAt: demoCreatedAt,
            },
            {
              id: "demo-team-interviewer",
              email: "interviewer@acmetalent.ai",
              role: "interviewer",
              status: "active",
              invitedAt: demoCreatedAt,
            },
          ];

          return {
            general: {
              ...state.general,
              companyName: state.general.companyName || "Acme Talent Labs",
              timezone: state.general.timezone || "UTC",
              defaultInterviewDurationMinutes:
                state.general.defaultInterviewDurationMinutes || 45,
              defaultHiringFlow:
                state.general.defaultHiringFlow || "Screening -> Interview -> Decision",
            },
            masterData: {
              departments: [...demoDepartments, ...cleanedMasterData.departments],
              designations: [...demoDesignations, ...cleanedMasterData.designations],
              branches: [...demoBranches, ...cleanedMasterData.branches],
              payScales: [...demoPayScales, ...cleanedMasterData.payScales],
              stages: state.masterData.stages,
            },
            workflows: state.workflows.filter((workflow) => !workflow.id.startsWith("demo-")),
            transitionRules: state.transitionRules.filter((rule) => !rule.stageId.startsWith("demo-")),
            aiAgents: state.aiAgents.filter((agent) => !agent.id.startsWith("demo-")),
            teamMembers: [
              ...demoTeamMembers,
              ...state.teamMembers.filter((member) => !member.id.startsWith("demo-")),
            ],
          };
        }),

      updateGeneral: (updates) =>
        set((state) => ({
          general: {
            ...state.general,
            ...updates,
          },
        })),

      addNamedMasterItem: (key, name) =>
        set((state) => {
          const clean = name.trim();
          if (!clean) {
            return state;
          }

          const exists = state.masterData[key].some(
            (item) => item.name.toLowerCase() === clean.toLowerCase()
          );
          if (exists) {
            return state;
          }

          const newItem: NamedMasterDataItem = {
            id: createId(),
            name: clean,
            createdAt: nowIso(),
          };

          return {
            masterData: {
              ...state.masterData,
              [key]: [...state.masterData[key], newItem],
            },
          };
        }),

      updateNamedMasterItem: (key, id, name) =>
        set((state) => {
          const clean = name.trim();
          if (!clean) {
            return state;
          }

          const exists = state.masterData[key].some(
            (item) => item.id !== id && item.name.toLowerCase() === clean.toLowerCase()
          );
          if (exists) {
            return state;
          }

          return {
            masterData: {
              ...state.masterData,
              [key]: state.masterData[key].map((item) =>
                item.id === id ? { ...item, name: clean } : item
              ),
            },
          };
        }),

      deleteNamedMasterItem: (key, id) =>
        set((state) => {
          const next = {
            masterData: {
              ...state.masterData,
              [key]: state.masterData[key].filter((item) => item.id !== id),
            },
          };

          if (key === "designations") {
            return {
              ...next,
              workflows: state.workflows.filter((workflow) => workflow.designationId !== id),
            };
          }

          return next;
        }),

      addStageTemplate: (payload) => {
        let result: { ok: boolean; reason?: string } = { ok: true };

        set((state) => {
          const cleanName = payload.name.trim();
          if (!cleanName) {
            result = { ok: false, reason: "Stage name is required" };
            return state;
          }

          const exists = state.masterData.stages.some(
            (stage) => stage.name.toLowerCase() === cleanName.toLowerCase()
          );

          if (exists) {
            result = { ok: false, reason: "Stage with this name already exists" };
            return state;
          }

          const stage: StageTemplate = {
            id: createId(),
            name: cleanName,
            type: payload.type,
            colorHex: normalizeStageColor(payload.colorHex, payload.type),
            durationMinutes: payload.durationMinutes,
            instructions: payload.instructions.trim(),
            createdAt: nowIso(),
          };

          return {
            masterData: {
              ...state.masterData,
              stages: [...state.masterData.stages, stage],
            },
          };
        });

        return result;
      },

      updateStageTemplate: (id, payload) => {
        let result: { ok: boolean; reason?: string } = { ok: true };

        set((state) => {
          const cleanName = payload.name.trim();
          if (!cleanName) {
            result = { ok: false, reason: "Stage name is required" };
            return state;
          }

          const exists = state.masterData.stages.some(
            (stage) => stage.id !== id && stage.name.toLowerCase() === cleanName.toLowerCase()
          );

          if (exists) {
            result = { ok: false, reason: "Stage with this name already exists" };
            return state;
          }

          return {
            masterData: {
              ...state.masterData,
              stages: state.masterData.stages.map((stage) =>
                stage.id === id
                  ? {
                      ...stage,
                      name: cleanName,
                      type: payload.type,
                      colorHex: normalizeStageColor(payload.colorHex, payload.type),
                      durationMinutes: payload.durationMinutes,
                      instructions: payload.instructions.trim(),
                    }
                  : stage
              ),
            },
          };
        });

        return result;
      },

      deleteStageTemplate: (id) =>
        set((state) => ({
          masterData: {
            ...state.masterData,
            stages: state.masterData.stages.filter((stage) => stage.id !== id),
          },
          workflows: state.workflows
            .map((workflow) => ({
              ...workflow,
              stages: workflow.stages.filter((item) => item.stageId !== id),
            }))
            .filter((workflow) => workflow.stages.length > 0),
          transitionRules: state.transitionRules.filter((rule) => rule.stageId !== id),
        })),

      setTransitionRule: (stageId, rule) =>
        set((state) => {
          const existing = state.transitionRules.find((item) => item.stageId === stageId);
          if (existing) {
            return {
              transitionRules: state.transitionRules.map((item) =>
                item.stageId === stageId ? { ...item, rule, updatedAt: nowIso() } : item
              ),
            };
          }
          return {
            transitionRules: [
              ...state.transitionRules,
              { stageId, rule, updatedAt: nowIso() },
            ],
          };
        }),

      clearTransitionRule: (stageId) =>
        set((state) => ({
          transitionRules: state.transitionRules.filter((item) => item.stageId !== stageId),
        })),

      saveWorkflowForDesignation: (designationId, stages) =>
        set((state) => {
          const validStages = stages.reduce<WorkflowStageAssignment[]>((acc, item) => {
            const exists = state.masterData.stages.some((stage) => stage.id === item.stageId);
            const isDuplicate = acc.some((existing) => existing.stageId === item.stageId);
            if (!exists || isDuplicate) {
              return acc;
            }
            acc.push({
              stageId: item.stageId,
              aiAgentId: item.aiAgentId,
            });
            return acc;
          }, []);

          const existing = state.workflows.find(
            (workflow) => workflow.designationId === designationId
          );

          if (existing) {
            return {
              workflows: state.workflows.map((workflow) =>
                workflow.designationId === designationId
                  ? {
                      ...workflow,
                      stages: validStages,
                      updatedAt: nowIso(),
                    }
                  : workflow
              ),
            };
          }

          const newWorkflow: DesignationWorkflow = {
            id: createId(),
            designationId,
            stages: validStages,
            updatedAt: nowIso(),
          };

          return {
            workflows: [...state.workflows, newWorkflow],
          };
        }),

      addPayScale: (rule) =>
        set((state) => ({
          masterData: {
            ...state.masterData,
            payScales: [
              ...state.masterData.payScales,
              {
                id: createId(),
                createdAt: nowIso(),
                ...rule,
              },
            ],
          },
        })),

      updatePayScale: (id, updates) =>
        set((state) => ({
          masterData: {
            ...state.masterData,
            payScales: state.masterData.payScales.map((rule) =>
              rule.id === id ? { ...rule, ...updates } : rule
            ),
          },
        })),

      deletePayScale: (id) =>
        set((state) => ({
          masterData: {
            ...state.masterData,
            payScales: state.masterData.payScales.filter((rule) => rule.id !== id),
          },
        })),

      addAiAgent: (payload) => {
        let result: { ok: boolean; reason?: string } = { ok: true };

        set((state) => {
          const cleanName = payload.name.trim();
          if (!cleanName) {
            result = { ok: false, reason: "Agent name is required" };
            return state;
          }

          const exists = state.aiAgents.some(
            (agent) => agent.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (exists) {
            result = { ok: false, reason: "AI agent with this name already exists" };
            return state;
          }

          const nextAgent: AiAgentConfig = {
            id: createId(),
            name: cleanName,
            contextMarkdown: payload.contextMarkdown.trim(),
            createdAt: nowIso(),
            updatedAt: nowIso(),
          };

          return {
            aiAgents: [nextAgent, ...state.aiAgents],
          };
        });

        return result;
      },

      updateAiAgent: (id, payload) => {
        let result: { ok: boolean; reason?: string } = { ok: true };

        set((state) => {
          const cleanName = payload.name.trim();
          if (!cleanName) {
            result = { ok: false, reason: "Agent name is required" };
            return state;
          }

          const exists = state.aiAgents.some(
            (agent) => agent.id !== id && agent.name.toLowerCase() === cleanName.toLowerCase()
          );
          if (exists) {
            result = { ok: false, reason: "AI agent with this name already exists" };
            return state;
          }

          const target = state.aiAgents.some((agent) => agent.id === id);
          if (!target) {
            result = { ok: false, reason: "AI agent not found" };
            return state;
          }

          return {
            aiAgents: state.aiAgents.map((agent) =>
              agent.id === id
                ? {
                    ...agent,
                    name: cleanName,
                    contextMarkdown: payload.contextMarkdown.trim(),
                    updatedAt: nowIso(),
                  }
                : agent
            ),
          };
        });

        return result;
      },

      deleteAiAgent: (id) =>
        set((state) => ({
          aiAgents: state.aiAgents.filter((agent) => agent.id !== id),
        })),

      addTeamMember: (email, role) => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          return { ok: false, reason: "Email is required" };
        }
        if (!cleanEmail.includes("@")) {
          return { ok: false, reason: "Email format is invalid" };
        }

        let canCreate = true;
        set((state) => {
          const exists = state.teamMembers.some((member) => member.email === cleanEmail);
          if (exists) {
            canCreate = false;
            return state;
          }

          const member: TeamMember = {
            id: createId(),
            email: cleanEmail,
            role,
            status: "invited",
            invitedAt: nowIso(),
          };

          return {
            teamMembers: [...state.teamMembers, member],
          };
        });

        if (!canCreate) {
          return { ok: false, reason: "Member already exists" };
        }
        return { ok: true };
      },

      updateTeamMemberRole: (id, role) =>
        set((state) => ({
          teamMembers: state.teamMembers.map((member) =>
            member.id === id
              ? {
                  ...member,
                  role,
                  status: "active",
                }
              : member
          ),
        })),

      removeTeamMember: (id) =>
        set((state) => ({
          teamMembers: state.teamMembers.filter((member) => member.id !== id),
        })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 6,
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<SettingsState> | undefined) ?? {};
        const persistedMasterData =
          (persisted.masterData as Partial<SettingsState["masterData"]> | undefined) ?? {};

        const hydratedStages = (persistedMasterData.stages ?? []).map((stage: StageTemplate) => ({
          ...stage,
          colorHex: normalizeStageColor(stage.colorHex, stage.type),
        }));

        const hydratedWorkflows = (persisted.workflows ?? currentState.workflows).map(
          (workflow) => {
            const stages = "stages" in workflow && Array.isArray(workflow.stages)
              ? workflow.stages
              : ((workflow as DesignationWorkflow & { stageIds?: string[] }).stageIds ?? []).map((stageId) => ({
                  stageId,
                }));

            return {
              ...workflow,
              stages,
            };
          }
        );

        return {
          ...currentState,
          ...persisted,
          general: {
            ...currentState.general,
            ...(persisted.general ?? {}),
          },
          masterData: {
            ...initialMasterData,
            ...persistedMasterData,
            stages: hydratedStages,
          },
          workflows: hydratedWorkflows,
          transitionRules: persisted.transitionRules ?? currentState.transitionRules,
          aiAgents: persisted.aiAgents ?? currentState.aiAgents,
          teamMembers: persisted.teamMembers ?? currentState.teamMembers,
          billing: {
            ...currentState.billing,
            ...(persisted.billing ?? {}),
          },
        };
      },
    }
  )
);
