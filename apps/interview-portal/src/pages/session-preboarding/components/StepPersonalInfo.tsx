import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { useState } from "react";
import { CompatibilityChecklist } from "./CompatibilityChecklist";
import type { CompatibilityCheck } from "../../../types/session";

type StepPersonalInfoProps = {
  name: string;
  email: string;
  checks: CompatibilityCheck[];
  onSubmit: () => void;
};

export const StepPersonalInfo = ({
  name,
  email,
  checks,
  onSubmit,
}: StepPersonalInfoProps): JSX.Element => {
  const [error, setError] = useState<string | null>(null);

  const hasBlockingIssue = checks.some((item) => !item.ok);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Confirm your interview details</CardTitle>
        <CardDescription>
          Your candidate details are loaded from the secure interview session link.
          No email entry is required.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-border bg-secondary/10 p-5">
          <div className="text-sm font-semibold text-muted-foreground">Candidate</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-input bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Full name</p>
              <p className="mt-2 text-sm font-medium text-foreground">{name}</p>
            </div>
            <div className="rounded-xl border border-input bg-background p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Email</p>
              <p className="mt-2 text-sm font-medium text-foreground">{email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-input bg-background p-5">
          <p className="text-sm font-semibold text-muted-foreground">What happens next</p>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>• Confirm these details match you.</li>
            <li>• Complete a quick identity verification step.</li>
            <li>• Join the interview room when ready.</li>
          </ul>
        </div>

        <CompatibilityChecklist checks={checks} />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button
          onClick={() => {
            if (hasBlockingIssue) {
              setError("Please resolve compatibility issues before continuing.");
              return;
            }

            setError(null);
            onSubmit();
          }}
          disabled={hasBlockingIssue}
        >
          Continue to Identity Verification
        </Button>
      </CardContent>
    </Card>
  );
};
