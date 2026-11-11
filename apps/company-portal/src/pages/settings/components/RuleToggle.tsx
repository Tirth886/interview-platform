import { cn } from "@shared/ui";
import type { RuleType } from "../../../types/settings";

export const RuleToggle = ({
  value,
  onChange,
  disabled,
}: {
  value: RuleType;
  onChange: (v: RuleType) => void;
  disabled: boolean;
}): JSX.Element => (
  <div className="flex gap-2">
    {(["none", "score", "manual"] as RuleType[]).map((rt) => (
      <button
        key={rt}
        type="button"
        disabled={disabled}
        onClick={() => onChange(rt)}
        className={cn(
          "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          value === rt
            ? "border-primary bg-primary/15 text-primary shadow-sm"
            : "border-border bg-background text-muted-foreground hover:bg-background/80",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        {rt === "none" ? "No rule" : rt === "score" ? "Score-based" : "Manual approval"}
      </button>
    ))}
  </div>
);
