import { Chrome, Linkedin } from "lucide-react";
import { Button } from "@shared/ui";

type SsoButtonsProps = {
  className?: string;
};

export const SsoButtons = ({ className }: SsoButtonsProps): JSX.Element => {
  return (
    <div className={`space-y-3 pt-1 ${className ?? ""}`.trim()}>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          SSO
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" disabled className="justify-start gap-2">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </Button>
        <Button type="button" variant="outline" disabled className="justify-start gap-2">
          <Chrome className="h-4 w-4" />
          Google
        </Button>
      </div>
    </div>
  );
};
