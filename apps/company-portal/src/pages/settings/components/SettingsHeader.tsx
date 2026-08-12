import { Badge, Button } from "@shared/ui";

type SettingsHeaderProps = {
  canEdit: boolean;
  onLoadDemo: () => void;
  demoMessage: string | null;
};

export const SettingsHeader = ({
  canEdit,
  onLoadDemo,
  demoMessage,
}: SettingsHeaderProps): JSX.Element => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure company preferences, core master data, team access, and billing.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button variant="outline" onClick={onLoadDemo}>
            Load Basic Demo Data
          </Button>
        )}
        <Badge variant={canEdit ? "success" : "warning"}>
          {canEdit ? "Admin access" : "Read only"}
        </Badge>
      </div>
    </div>

    {demoMessage ? <p className="text-sm text-emerald-700">{demoMessage}</p> : null}
  </>
);
