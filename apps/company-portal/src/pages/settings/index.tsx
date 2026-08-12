import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { MasterDataSection as MasterDataSectionId, SettingsTab, TeamRole } from "../../types/settings";
import { SettingsHeader } from "./components/SettingsHeader";
import { SettingsNav } from "./components/SettingsNav";
import { GeneralSettingsSection } from "./components/GeneralSettingsSection";
import { MasterDataSection } from "./components/MasterDataSection";
import { AiAgentSection } from "./components/AiAgentSection";
import { HiringWorkflowSection } from "./components/HiringWorkflowSection";
import { TeamSection } from "./components/TeamSection";
import { BillingSection } from "./components/BillingSection";

export default function SettingsPage(): JSX.Element {
  const session = useAuthStore((state) => state.session);
  const {
    general,
    masterData,
    workflows,
    aiAgents,
    teamMembers,
    billing,
    updateGeneral,
    addTeamMember,
    updateTeamMemberRole,
    removeTeamMember,
    seedDemoData,
  } = useSettingsStore();

  const canEdit = session?.user.role === "admin";

  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [activeMasterSection, setActiveMasterSection] =
    useState<MasterDataSectionId>("departments");

  const [generalForm, setGeneralForm] = useState(general);
  const [teamInviteEmail, setTeamInviteEmail] = useState("");
  const [teamInviteRole, setTeamInviteRole] = useState<TeamRole>("recruiter");
  const [teamError, setTeamError] = useState<string | null>(null);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  useEffect(() => {
    setGeneralForm(general);
  }, [general]);

  useEffect(() => {
    if (!general.companyName && session?.user.company.name) {
      updateGeneral({ companyName: session.user.company.name });
    }
  }, [general.companyName, session?.user.company.name, updateGeneral]);

  const seatsRemaining = useMemo(
    () => Math.max(0, billing.seatsLimit - billing.seatsUsed),
    [billing.seatsLimit, billing.seatsUsed]
  );

  const workflowCoverage = useMemo(() => {
    if (masterData.designations.length === 0) {
      return 0;
    }
    return Math.round((workflows.length / masterData.designations.length) * 100);
  }, [masterData.designations.length, workflows.length]);

  return (
    <div className="space-y-6">
      <SettingsHeader
        canEdit={canEdit}
        demoMessage={demoMessage}
        onLoadDemo={() => {
          seedDemoData();
          setDemoMessage("Demo data loaded for basic settings only.");
        }}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr]">
        <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="space-y-4">
          {activeTab === "general" && (
            <GeneralSettingsSection
              canEdit={canEdit}
              generalForm={generalForm}
              setGeneralForm={setGeneralForm}
              onSave={() =>
                updateGeneral({
                  ...generalForm,
                  defaultInterviewDurationMinutes: Math.max(
                    15,
                    Number(generalForm.defaultInterviewDurationMinutes) || 45
                  ),
                })
              }
            />
          )}

          {activeTab === "master-data" && (
            <MasterDataSection
              canEdit={canEdit}
              activeMasterSection={activeMasterSection}
              setActiveMasterSection={setActiveMasterSection}
              departments={masterData.departments}
              designations={masterData.designations}
              branches={masterData.branches}
            />
          )}

          {activeTab === "ai-agent" && (
            <AiAgentSection canEdit={canEdit} agentCount={aiAgents.length} />
          )}

          {activeTab === "hiring-workflow" && (
            <HiringWorkflowSection
              canEdit={canEdit}
              workflowCount={workflows.length}
              designationCount={masterData.designations.length}
              workflowCoverage={workflowCoverage}
            />
          )}

          {activeTab === "team" && (
            <TeamSection
              canEdit={canEdit}
              teamMembers={teamMembers}
              teamInviteEmail={teamInviteEmail}
              setTeamInviteEmail={setTeamInviteEmail}
              teamInviteRole={teamInviteRole}
              setTeamInviteRole={setTeamInviteRole}
              teamError={teamError}
              onInvite={() => {
                const result = addTeamMember(teamInviteEmail, teamInviteRole);
                if (!result.ok) {
                  setTeamError(result.reason ?? "Unable to invite member");
                  return;
                }
                setTeamError(null);
                setTeamInviteEmail("");
              }}
              onUpdateRole={updateTeamMemberRole}
              onRemove={removeTeamMember}
            />
          )}

          {activeTab === "billing" && (
            <BillingSection billing={billing} seatsRemaining={seatsRemaining} />
          )}
        </div>
      </div>
    </div>
  );
}
