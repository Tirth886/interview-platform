import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { WorkflowFlowEditor } from "./components/WorkflowFlowEditor";

export default function WorkflowEditorPage(): JSX.Element {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const workflows = useSettingsStore((state) => state.workflows);
  const workflowsHydrated = useSettingsStore((state) => state.workflowsHydrated);
  const hydrateStagesAndWorkflows = useSettingsStore((state) => state.hydrateStagesAndWorkflows);
  const updateWorkflowGraph = useSettingsStore((state) => state.updateWorkflowGraph);

  const canEdit = session?.user.role === "admin";
  const workflow = workflows.find((item) => item.id === workflowId);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    void hydrateStagesAndWorkflows(session.token);
  }, [session?.token, hydrateStagesAndWorkflows]);

  if (!workflowId) {
    return <Navigate to="/app/master/hiring-workflow" replace />;
  }

  if (!workflowsHydrated) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Loading workflow…
      </div>
    );
  }

  if (!workflow) {
    return <Navigate to="/app/master/hiring-workflow" replace />;
  }

  return (
    <div className="space-y-3">
      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
      <WorkflowFlowEditor
        workflow={workflow}
        canEdit={canEdit}
        onBack={() => navigate("/app/master/hiring-workflow")}
        onSave={(payload) => {
          if (!session?.token) {
            setSaveError("You must be signed in to save the workflow.");
            return;
          }
          void updateWorkflowGraph(workflow.id, payload, session.token).then((result) => {
            if (!result.ok) {
              setSaveError(result.reason ?? "Unable to save workflow.");
            } else {
              setSaveError(null);
            }
          });
        }}
      />
    </div>
  );
}
