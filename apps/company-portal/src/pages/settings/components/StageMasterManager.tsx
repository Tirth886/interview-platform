import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui";
import { useAuthStore } from "../../../stores/useAuthStore";
import { useSettingsStore } from "../../../stores/useSettingsStore";
import { getStageIcon } from "../../../utils/stageIcons";
import { getDefaultStageColor } from "../../../utils/jobUtils";

export const StageMasterManager = ({ canEdit: _canEdit }: { canEdit: boolean }): JSX.Element => {
  const session = useAuthStore((state) => state.session);
  const stages = useSettingsStore((state) => state.masterData.stages ?? []);
  const stagesHydrated = useSettingsStore((state) => state.stagesHydrated);
  const hydrateStages = useSettingsStore((state) => state.hydrateStages);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.token) return;
    void hydrateStages(session.token).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Unable to load stages.");
    });
  }, [session?.token, hydrateStages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stage types</CardTitle>
        <CardDescription>
          Platform type catalog (ATS, Coding, DSA, …). Each hiring workflow stage picks a type and
          defines its own name and code.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}

        {!stagesHydrated && !loadError ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            Loading stages…
          </div>
        ) : stages.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-4 py-7 text-center text-sm text-muted-foreground">
            No platform stages available yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {stages.map((stage) => {
              const Icon = getStageIcon(stage.icon);
              return (
                <div
                  key={stage.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                    style={{
                      backgroundColor: stage.colorHex ?? getDefaultStageColor(stage.type),
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{stage.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(stage.stageType ?? stage.type).replace(/_/g, " ")}
                      {stage.code ? ` · ${stage.code}` : ""}
                    </p>
                    {stage.instructions ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {stage.instructions}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
