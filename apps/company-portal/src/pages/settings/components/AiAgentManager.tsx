import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@shared/ui";
import type { AiAgentConfig, AiAgentForm } from "../../../types/settings";
import { blankAiAgentForm } from "../../../constants/settings";
import { useSettingsStore } from "../../../stores/useSettingsStore";

export const AiAgentManager = ({ canEdit }: { canEdit: boolean }): JSX.Element => {
  const aiAgents = useSettingsStore((state) => state.aiAgents ?? []);
  const addAiAgent = useSettingsStore((state) => state.addAiAgent);
  const updateAiAgent = useSettingsStore((state) => state.updateAiAgent);
  const deleteAiAgent = useSettingsStore((state) => state.deleteAiAgent);

  const [newAgent, setNewAgent] = useState<AiAgentForm>(blankAiAgentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<AiAgentForm>(blankAiAgentForm);
  const [formError, setFormError] = useState<string | null>(null);

  const startEdit = (agent: AiAgentConfig): void => {
    setEditingId(agent.id);
    setEditingForm({
      name: agent.name,
      contextMarkdown: agent.contextMarkdown,
    });
    setFormError(null);
  };

  const saveCreate = (): void => {
    const result = addAiAgent(newAgent);
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to create AI agent");
      return;
    }
    setNewAgent(blankAiAgentForm);
    setFormError(null);
  };

  const saveEdit = (): void => {
    if (!editingId) {
      return;
    }
    const result = updateAiAgent(editingId, editingForm);
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to update AI agent");
      return;
    }
    setEditingId(null);
    setEditingForm(blankAiAgentForm);
    setFormError(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Creation</CardTitle>
        <CardDescription>
          Create named AI agents and write their rule context in Markdown format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 rounded-md border border-border p-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Agent Name</label>
            <Input
              value={newAgent.name}
              onChange={(event) =>
                setNewAgent((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="e.g. Resume Screener Agent"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">AI Context (Markdown)</label>
            <textarea
              value={newAgent.contextMarkdown}
              onChange={(event) =>
                setNewAgent((prev) => ({ ...prev, contextMarkdown: event.target.value }))
              }
              placeholder="# Rules\n\n- Evaluate candidate communication\n- Keep tone formal"
              disabled={!canEdit}
              className="min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Use Markdown headings, bullets, and checklists to define the agent behavior.
            </p>
          </div>
          <Button disabled={!canEdit || !newAgent.name.trim()} onClick={saveCreate}>
            Create AI Agent
          </Button>
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}

        {aiAgents.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No AI agents yet. Create one to store reusable prompt rules and context.
          </div>
        ) : (
          <div className="space-y-3">
            {aiAgents.map((agent) => {
              const isEditing = editingId === agent.id;
              return (
                <div key={agent.id} className="space-y-3 rounded-md border border-border p-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Agent Name</label>
                        <Input
                          value={editingForm.name}
                          onChange={(event) =>
                            setEditingForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          disabled={!canEdit}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">AI Context (Markdown)</label>
                        <textarea
                          value={editingForm.contextMarkdown}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              contextMarkdown: event.target.value,
                            }))
                          }
                          disabled={!canEdit}
                          className="min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" disabled={!canEdit} onClick={saveEdit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingForm(blankAiAgentForm);
                            setFormError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {agent.updatedAt.slice(0, 10)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" disabled={!canEdit} onClick={() => startEdit(agent)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={!canEdit}
                            onClick={() => deleteAiAgent(agent.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3 font-mono text-xs text-foreground">
                        {agent.contextMarkdown || "No AI context added."}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
