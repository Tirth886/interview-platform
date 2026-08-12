import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

export default function LandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            AI Interview Platform
          </p>
          <CardTitle className="text-3xl">Hire Faster With AI Interviews</CardTitle>
          <CardDescription>
            Create your company account or sign in to manage recruiters, candidates,
            interviews, and hiring pipelines.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="sm:flex-1">
            <Link to="/auth/signup">Sign Up</Link>
          </Button>
          <Button asChild variant="outline" className="sm:flex-1">
            <Link to="/auth/login">Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
