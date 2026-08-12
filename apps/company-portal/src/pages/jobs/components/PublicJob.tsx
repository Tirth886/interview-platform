import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@shared/ui";
import { useJobManagementStore } from "../../../stores/useJobManagementStore";

export default function PublicJobPage(): JSX.Element {
  const { slug = "" } = useParams();
  const jobs = useJobManagementStore((state) => state.jobs);
  const addPublicApplication = useJobManagementStore((state) => state.addPublicApplication);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [keywordsText, setKeywordsText] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const job = useMemo(
    () => jobs.find((item) => item.slug === slug && item.isPublic) ?? null,
    [jobs, slug]
  );

  if (!job) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Unavailable</CardTitle>
            <CardDescription>This job link is invalid, private, or no longer active.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription>{job.description || "No additional description"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Location: {job.location || "Not specified"}</p>
          <p className="text-sm text-muted-foreground">
            Experience: {job.experienceMinYears} - {job.experienceMaxYears} years
          </p>
          <p className="text-sm text-muted-foreground">
            Salary: {job.salaryMin ?? "-"} - {job.salaryMax ?? "-"} {job.salaryCurrency}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apply Now</CardTitle>
          <CardDescription>Submit your profile for this role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {submitted ? (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Application submitted successfully.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Resume Link</label>
                <Input
                  placeholder="https://..."
                  value={resumeUrl}
                  onChange={(event) => setResumeUrl(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Experience Summary</label>
                <textarea
                  value={experienceSummary}
                  onChange={(event) => setExperienceSummary(event.target.value)}
                  placeholder="Summarize your years of experience, domain background, and recent work."
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Profile Keywords</label>
                <Input
                  placeholder="React, TypeScript, Node.js"
                  value={keywordsText}
                  onChange={(event) => setKeywordsText(event.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                onClick={() => {
                  const result = addPublicApplication({
                    jobSlug: job.slug,
                    name,
                    email,
                    resumeUrl,
                    experienceSummary,
                    keywordsText,
                  });
                  if (!result.ok) {
                    setError(result.reason ?? "Unable to submit application");
                    return;
                  }
                  setError(null);
                  setSubmitted(true);
                }}
              >
                Submit Application
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
