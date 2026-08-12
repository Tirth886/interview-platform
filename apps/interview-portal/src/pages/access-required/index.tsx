import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui";
import { Link } from "react-router-dom";
import { DEMO_CANDIDATE_LINK } from "../../constants/mockInterviewSessions";

export default function AccessRequiredPage(): JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Interview Access Link Required</CardTitle>
          <CardDescription>
            This portal is link-based. Please open the interview URL shared with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Expected format:</p>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs">
            /session/&lt;sessionId&gt;?role=candidate&amp;user=you@example.com
          </div>

          <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Reusable Demo Link</p>
            <div className="space-y-1.5">
              <p className="font-mono text-xs text-foreground">{DEMO_CANDIDATE_LINK}</p>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link to={DEMO_CANDIDATE_LINK}>Open Demo Session</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
