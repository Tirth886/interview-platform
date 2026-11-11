import { Button } from "@shared/ui";
import type { ReactNode } from "react";

type SettingsHeaderProps = {
  title: string;
  description: string;
  onLoadDemo?: () => void;
  demoMessage: string | null;
  actions?: ReactNode;
};

export const SettingsHeader = ({
  title,
  description,
  onLoadDemo,
  demoMessage,
  actions,
}: SettingsHeaderProps): JSX.Element => (
  <>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {onLoadDemo ? (
          <Button variant="outline" onClick={onLoadDemo}>
            Load Basic Demo Data
          </Button>
        ) : null}
        {actions}
      </div>
    </div>

    {demoMessage ? <p className="text-sm text-emerald-700">{demoMessage}</p> : null}
  </>
);
