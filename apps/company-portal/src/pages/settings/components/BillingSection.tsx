import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui";
import type { BillingSettings } from "../../../types/settings";

type BillingSectionProps = {
  billing: BillingSettings;
  seatsRemaining: number;
};

export const BillingSection = ({ billing, seatsRemaining }: BillingSectionProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle>Billing</CardTitle>
      <CardDescription>
        Subscription management will be expanded in a later release.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{billing.planName}</p>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Seats</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {billing.seatsUsed} / {billing.seatsLimit}
          </p>
          <p className="text-xs text-muted-foreground">{seatsRemaining} remaining</p>
        </div>
        <div className="rounded-md border border-border bg-muted/30 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Next Renewal</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{billing.renewalDate}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled>
          Upgrade or Downgrade
        </Button>
        <Button variant="outline" disabled>
          View Invoices
        </Button>
      </div>
    </CardContent>
  </Card>
);
