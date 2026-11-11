import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AiAgentConfig,
  BillingSettings,
  CreateWorkflowPayload,
  GeneralSettings,
  HiringWorkflow,
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
  WorkflowFlowEdge,
  WorkflowFlowNode,
  WorkflowStageAssignment,
} from "../types/settings";
import { createDefaultWorkflowGraph } from "../constants/workflow";
import { listStages } from "../services/stages";
import {
  createAiAgent as createAiAgentApi,
  deleteAiAgent as deleteAiAgentApi,
  listAiAgents,
  updateAiAgent as updateAiAgentApi,
} from "../services/aiAgents";
import {
  createWorkflow as createWorkflowApi,
  deleteWorkflow as deleteWorkflowApi,
  listWorkflows,
  updateWorkflow as updateWorkflowApi,
} from "../services/workflows";

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

type WorkflowMutationResult = { ok: boolean; reason?: string; workflow?: HiringWorkflow };
type AiAgentMutationResult = { ok: boolean; reason?: string; agent?: AiAgentConfig };

type SettingsStore = SettingsState & {
  stagesHydrated: boolean;
  workflowsHydrated: boolean;
  aiAgentsHydrated: boolean;
  seedDemoData: () => void;
  updateGeneral: (updates: Partial<GeneralSettings>) => void;
  addNamedMasterItem: (key: NamedMasterKey, name: string) => void;
  updateNamedMasterItem: (key: NamedMasterKey, id: string, name: string) => void;
  deleteNamedMasterItem: (key: NamedMasterKey, id: string) => void;
  setTransitionRule: (stageId: string, rule: TransitionRule) => void;
  clearTransitionRule: (stageId: string) => void;
  hydrateStages: (token: string) => Promise<void>;
  hydrateWorkflows: (token: string) => Promise<void>;
  hydrateAiAgents: (token: string) => Promise<void>;
  hydrateStagesAndWorkflows: (token: string) => Promise<void>;
  saveWorkflowForDesignation: (designationId: string, stages: WorkflowStageAssignment[]) => void;
  createWorkflow: (
    payload: CreateWorkflowPayload,
    token: string
  ) => Promise<WorkflowMutationResult>;
  updateWorkflowGraph: (
    id: string,
    payload: { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] },
    token: string
  ) => Promise<WorkflowMutationResult>;
  renameWorkflow: (
    id: string,
    name: string,
    token: string
  ) => Promise<WorkflowMutationResult>;
  deleteWorkflow: (id: string, token: string) => Promise<WorkflowMutationResult>;
  addPayScale: (rule: Omit<PayScaleRule, "id" | "createdAt">) => void;
  updatePayScale: (id: string, updates: Omit<PayScaleRule, "id" | "createdAt">) => void;
  deletePayScale: (id: string) => void;
  addAiAgent: (
    payload: { name: string; contextMarkdown: string },
    token: string
  ) => Promise<AiAgentMutationResult>;
  updateAiAgent: (
    id: string,
    payload: { name: string; contextMarkdown: string },
    token: string
  ) => Promise<AiAgentMutationResult>;
  deleteAiAgent: (id: string, token: string) => Promise<AiAgentMutationResult>;
  addTeamMember: (email: string, role: TeamRole) => { ok: boolean; reason?: string };
  updateTeamMemberRole: (id: string, role: TeamRole) => void;
  removeTeamMember: (id: string) => void;
};

const toStageTemplate = (stage: StageTemplate): StageTemplate => ({
  id: stage.id,
  name: stage.name,
  type: stage.type === "human" ? "human" : "ai",
  colorHex: normalizeStageColor(stage.colorHex, stage.type === "human" ? "human" : "ai"),
  durationMinutes: stage.durationMinutes ?? null,
  instructions: stage.instructions ?? "",
  createdAt: stage.createdAt,
  stageType: stage.stageType,
  isEnabled: stage.isEnabled ?? true,
  isSystem: stage.isSystem ?? true,
  code: stage.code,
  icon: stage.icon ?? "circle",
  updatedAt: stage.updatedAt,
});

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      general: initialGeneral,
      masterData: initialMasterData,
      workflows: [] as HiringWorkflow[],
      transitionRules: [] as StageTransitionRule[],
      aiAgents: [] as AiAgentConfig[],
      teamMembers: [] as TeamMember[],
      billing: initialBilling,
      stagesHydrated: false,
      workflowsHydrated: false,
      aiAgentsHydrated: false,

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

      hydrateStages: async (token) => {
        const items = await listStages(token);
        set((state) => ({
          stagesHydrated: true,
          masterData: {
            ...state.masterData,
            stages: items.map(toStageTemplate),
          },
        }));
      },

      hydrateWorkflows: async (token) => {
        const items = await listWorkflows(token);
        set({
          workflowsHydrated: true,
          workflows: items,
        });
      },

      hydrateAiAgents: async (token) => {
        const items = await listAiAgents(token);
        set({
          aiAgentsHydrated: true,
          aiAgents: items,
        });
      },

      hydrateStagesAndWorkflows: async (token) => {
        const [stages, workflows, agents] = await Promise.all([
          listStages(token),
          listWorkflows(token),
          listAiAgents(token),
        ]);
        set((state) => ({
          stagesHydrated: true,
          workflowsHydrated: true,
          aiAgentsHydrated: true,
          masterData: {
            ...state.masterData,
            stages: stages.map(toStageTemplate),
          },
          workflows,
          aiAgents: agents,
        }));
      },

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

          const createdAt = nowIso();
          const graph = createDefaultWorkflowGraph();
          const newWorkflow: HiringWorkflow = {
            id: createId(),
            name: "Untitled workflow",
            designationId,
            stages: validStages,
            nodes: graph.nodes,
            edges: graph.edges,
            jobDescriptionFileName: "",
            jobDescriptionUrl: "",
            jobDescriptionKey: "",
            createdAt,
            updatedAt: createdAt,
          };

          return {
            workflows: [...state.workflows, newWorkflow],
          };
        }),

      createWorkflow: async (payload, token) => {
        const trimmed = payload.name.trim();
        if (!trimmed) {
          return { ok: false, reason: "Workflow name is required." };
        }

        const fileName = payload.jobDescriptionFileName.trim();
        const url = payload.jobDescriptionUrl.trim();
        const key = payload.jobDescriptionKey.trim();
        if (!fileName || !url || !key) {
          return { ok: false, reason: "Job description file is required." };
        }

        try {
          const workflow = await createWorkflowApi(
            {
              name: trimmed,
              jobDescriptionFileName: fileName,
              jobDescriptionUrl: url,
              jobDescriptionKey: key,
            },
            token
          );
          set((state) => ({
            workflows: [workflow, ...state.workflows.filter((item) => item.id !== workflow.id)],
          }));
          return { ok: true, workflow };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to create workflow.",
          };
        }
      },

      updateWorkflowGraph: async (id, payload, token) => {
        try {
          const workflow = await updateWorkflowApi(
            id,
            { nodes: payload.nodes, edges: payload.edges },
            token
          );
          set((state) => ({
            workflows: state.workflows.map((item) => (item.id === id ? workflow : item)),
          }));
          return { ok: true, workflow };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to save workflow.",
          };
        }
      },

      renameWorkflow: async (id, name, token) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return { ok: false, reason: "Workflow name is required." };
        }

        try {
          const workflow = await updateWorkflowApi(id, { name: trimmed }, token);
          set((state) => ({
            workflows: state.workflows.map((item) => (item.id === id ? workflow : item)),
          }));
          return { ok: true, workflow };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to rename workflow.",
          };
        }
      },

      deleteWorkflow: async (id, token) => {
        try {
          await deleteWorkflowApi(id, token);
          set((state) => ({
            workflows: state.workflows.filter((workflow) => workflow.id !== id),
          }));
          return { ok: true };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to delete workflow.",
          };
        }
      },

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

      addAiAgent: async (payload, token) => {
        const cleanName = payload.name.trim();
        if (!cleanName) {
          return { ok: false, reason: "Agent name is required" };
        }

        const exists = get().aiAgents.some(
          (agent) => agent.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) {
          return { ok: false, reason: "AI agent with this name already exists" };
        }

        try {
          const agent = await createAiAgentApi(
            {
              name: cleanName,
              contextMarkdown: payload.contextMarkdown.trim(),
            },
            token
          );
          set((state) => ({
            aiAgents: [agent, ...state.aiAgents.filter((item) => item.id !== agent.id)],
          }));
          return { ok: true, agent };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to create AI agent",
          };
        }
      },

      updateAiAgent: async (id, payload, token) => {
        const cleanName = payload.name.trim();
        if (!cleanName) {
          return { ok: false, reason: "Agent name is required" };
        }

        const exists = get().aiAgents.some(
          (agent) => agent.id !== id && agent.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (exists) {
          return { ok: false, reason: "AI agent with this name already exists" };
        }

        try {
          const agent = await updateAiAgentApi(
            id,
            {
              name: cleanName,
              contextMarkdown: payload.contextMarkdown.trim(),
            },
            token
          );
          set((state) => ({
            aiAgents: state.aiAgents.map((item) => (item.id === id ? agent : item)),
          }));
          return { ok: true, agent };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to update AI agent",
          };
        }
      },

      deleteAiAgent: async (id, token) => {
        try {
          await deleteAiAgentApi(id, token);
          set((state) => ({
            aiAgents: state.aiAgents.filter((agent) => agent.id !== id),
          }));
          return { ok: true };
        } catch (error: unknown) {
          return {
            ok: false,
            reason: error instanceof Error ? error.message : "Unable to delete AI agent",
          };
        }
      },

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
      version: 10,
      partialize: (state) => ({
        general: state.general,
        masterData: {
          departments: state.masterData.departments,
          designations: state.masterData.designations,
          branches: state.masterData.branches,
          payScales: state.masterData.payScales,
          // stages come from API
          stages: [] as StageTemplate[],
        },
        // workflows come from API
        workflows: [] as HiringWorkflow[],
        transitionRules: state.transitionRules,
        // aiAgents come from API
        aiAgents: [] as AiAgentConfig[],
        teamMembers: state.teamMembers,
        billing: state.billing,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<SettingsState> | undefined) ?? {};
        const persistedMasterData =
          (persisted.masterData as Partial<SettingsState["masterData"]> | undefined) ?? {};

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
            stages: currentState.masterData.stages,
          },
          workflows: currentState.workflows,
          stagesHydrated: false,
          workflowsHydrated: false,
          aiAgentsHydrated: false,
          transitionRules: persisted.transitionRules ?? currentState.transitionRules,
          aiAgents: currentState.aiAgents,
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
