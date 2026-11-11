import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { masterNavItems } from "../../constants/navigation";
import { SettingsHeader } from "./components/SettingsHeader";
import { GeneralSettingsSection } from "./components/GeneralSettingsSection";
import { AiAgentSection } from "./components/AiAgentSection";
import { HiringWorkflowSection } from "./components/HiringWorkflowSection";
import { QaSection } from "./components/QaSection";
import { BillingSection } from "./components/BillingSection";

const sectionMeta: Record<string, { title: string; description: string }> = {
  general: {
    title: "General Settings",
    description: "Company profile and default interview preferences.",
  },
  billing: {
    title: "Billing",
    description: "Plan details, seats, and invoices.",
  },
  "hiring-workflow": {
    title: "Hiring Workflow",
    description: "Create named workflows and design stage flowcharts.",
  },
  "ai-agent": {
    title: "AI Agents",
    description: "Reusable AI agent contexts and rules.",
  },
  qa: {
    title: "Q&A",
    description: "Question banks with options and correct answers for workflow stages.",
  },
};

const validSections = new Set([
  "general",
  "billing",
  ...masterNavItems.map((item) => item.section),
]);

export default function SettingsPage(): JSX.Element {
  const { section = "general" } = useParams<{ section: string }>();
  const session = useAuthStore((state) => state.session);
  const {
    general,
    billing,
    updateGeneral,
    seedDemoData,
  } = useSettingsStore();

  const canEdit = session?.user.role === "admin";

  const [generalForm, setGeneralForm] = useState(general);
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

  if (!validSections.has(section)) {
    return <Navigate to="/app/master/hiring-workflow" replace />;
  }

  const meta = sectionMeta[section] ?? sectionMeta.general;

  const usesInlineHeader =
    section === "ai-agent" || section === "hiring-workflow" || section === "qa";

  return (
    <div className="space-y-6">
      {!usesInlineHeader ? (
        <SettingsHeader
          title={meta.title}
          description={meta.description}
          demoMessage={demoMessage}
          onLoadDemo={
            section === "general" && canEdit
              ? () => {
                  seedDemoData();
                  setDemoMessage("Demo data loaded for basic settings only.");
                }
              : undefined
          }
        />
      ) : null}

      <div className="space-y-4">
        {section === "general" && (
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

        {section === "ai-agent" && (
          <AiAgentSection
            canEdit={canEdit}
            title={meta.title}
            description={meta.description}
          />
        )}

        {section === "qa" && (
          <QaSection canEdit={canEdit} title={meta.title} description={meta.description} />
        )}

        {section === "hiring-workflow" && (
          <HiringWorkflowSection
            canEdit={canEdit}
            title={meta.title}
            description={meta.description}
          />
        )}

        {section === "billing" && (
          <BillingSection billing={billing} seatsRemaining={seatsRemaining} />
        )}
      </div>
    </div>
  );
}
