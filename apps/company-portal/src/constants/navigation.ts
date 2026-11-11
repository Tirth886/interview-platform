import type { SettingsTab } from "../types/settings";

export type MasterNavItem = {
  to: string;
  label: string;
  section: Extract<SettingsTab, "hiring-workflow" | "ai-agent" | "qa">;
};

export const masterNavItems: MasterNavItem[] = [
  { to: "/app/master/hiring-workflow", label: "Hiring Workflow", section: "hiring-workflow" },
  { to: "/app/master/ai-agent", label: "AI Agents", section: "ai-agent" },
  { to: "/app/master/qa", label: "Q&A", section: "qa" },
];

export const profileSettingsItems = [
  { to: "/app/settings/general", label: "General Settings" },
  { to: "/app/settings/billing", label: "Billing" },
] as const;
