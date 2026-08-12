import { cn } from "@shared/ui";
import type { CompatibilityCheck } from "../../../types/session";

type CompatibilityChecklistProps = {
  checks: CompatibilityCheck[];
  title?: string;
};

export const CompatibilityChecklist = ({
  checks,
  title = "System Compatibility",
}: CompatibilityChecklistProps): JSX.Element => {
  if (checks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
        Compatibility checks will run automatically.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.key} className="rounded-md border border-border bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{check.label}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  check.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                )}
              >
                {check.ok ? "OK" : "Action needed"}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{check.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
