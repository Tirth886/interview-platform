import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui";
import { useJobManagementStore } from "../../../stores/useJobManagementStore";
import { useSettingsStore } from "../../../stores/useSettingsStore";

const formatDate = (iso: string): string => iso.slice(0, 10);

const statusVariant = (status: "pending" | "active" | "hold" | "rejected" | "selected") => {
  if (status === "selected") {
    return "success" as const;
  }
  if (status === "hold") {
    return "warning" as const;
  }
  if (status === "rejected") {
    return "destructive" as const;
  }
  return "secondary" as const;
};

export default function JobDetailPage(): JSX.Element {
  const { jobId = "" } = useParams();

  const jobs = useJobManagementStore((state) => state.jobs);
  const candidates = useJobManagementStore((state) => state.candidates);
  const moveCandidateStage = useJobManagementStore((state) => state.moveCandidateStage);
  const setJobPublic = useJobManagementStore((state) => state.setJobPublic);
  const setJobStatus = useJobManagementStore((state) => state.setJobStatus);
  const deleteJob = useJobManagementStore((state) => state.deleteJob);

  const masterData = useSettingsStore((state) => state.masterData);
  const aiAgents = useSettingsStore((state) => state.aiAgents);

  const [tab, setTab] = useState<"candidates" | "settings">("candidates");
  const [copied, setCopied] = useState(false);

  const job = jobs.find((item) => item.id === jobId) ?? null;

  const jobCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.jobId === jobId),
    [candidates, jobId]
  );

  const departmentName =
    masterData.departments.find((item) => item.id === job?.departmentId)?.name ?? "-";
  const designationName =
    masterData.designations.find((item) => item.id === job?.designationId)?.name ?? "-";
  const skillNames = job?.skillKeywords ?? [];
  const aiAgentMap = useMemo(
    () => new Map(aiAgents.map((agent) => [agent.id, agent.name])),
    [aiAgents]
  );

  if (!job) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Job Not Found</h1>
        <p className="text-sm text-muted-foreground">The requested job does not exist.</p>
        <Button asChild variant="outline">
          <Link to="/app/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/jobs/${job.slug}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">Job information, workflow, and candidates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={job.status === "published" ? "success" : "secondary"}>{job.status}</Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/app/jobs">Back to Jobs</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Info</CardTitle>
          <CardDescription>Core metadata and public distribution link.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{job.description || "No description"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{departmentName}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Designation</p>
                <p className="text-sm font-medium">{designationName}</p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
                <p className="text-sm font-medium">
                  {job.experienceMinYears} - {job.experienceMaxYears} years
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Salary</p>
                <p className="text-sm font-medium">
                  {job.salaryMin ?? "-"} - {job.salaryMax ?? "-"} {job.salaryCurrency}
                </p>
              </div>
              <div className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Expected ATS Score</p>
                <p className="text-sm font-medium">{job.expectedAtsScore}%</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {skillNames.length === 0 ? (
                <span className="text-xs text-muted-foreground">No skills linked</span>
              ) : (
                skillNames.map((skill) => (
                  <span key={skill} className="rounded-full border border-border px-2 py-0.5 text-xs">
                    {skill}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <p className="text-sm font-semibold">Public Job Link</p>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} />
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(publicUrl);
                  setCopied(true);
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(job.createdAt)} · Updated {formatDate(job.updatedAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow View</CardTitle>
          <CardDescription>Stages auto-applied from designation and custom edits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {job.workflowStages.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No stages configured.
            </div>
          ) : (
            job.workflowStages.map((stage, index) => (
              <div key={stage.id} className="rounded-md border border-border p-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.colorHex }} />
                  {index + 1}. {stage.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stage.type.toUpperCase()} · {stage.durationMinutes ?? "No duration"}
                  {stage.durationMinutes ? " mins" : ""}
                </p>
                {stage.type === "ai" && stage.aiAgentId && (
                  <p className="text-xs text-muted-foreground">
                    Agent: {aiAgentMap.get(stage.aiAgentId) ?? "Unknown agent"}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Panels</CardTitle>
          <CardDescription>Candidates and settings tabs for this job.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("candidates")}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                tab === "candidates"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Candidates
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                tab === "settings"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              Settings
            </button>
          </div>

          {tab === "candidates" && (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/app/candidates?jobId=${job.id}`}>Open Global Candidate View</Link>
                </Button>
              </div>
              {jobCandidates.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No candidates for this job yet.
                </div>
              ) : (
                jobCandidates.map((candidate) => {
                  const matchScore = candidate.aiEvaluation.overallScore;
                  const passed = matchScore >= job.expectedAtsScore;

                  return (
                    <div key={candidate.id} className="rounded-md border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">ATS Match</p>
                          <p className="text-sm font-semibold text-foreground">{matchScore}%</p>
                          <p className={`text-xs ${passed ? "text-emerald-700" : "text-amber-700"}`}>
                            {passed ? "Meets expected score" : "Below expected score"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant(candidate.status)}>{candidate.status}</Badge>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/app/candidates/${candidate.id}`}>Open Profile</Link>
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 max-w-sm">
                        <Select
                          value={candidate.currentStageId}
                          onValueChange={(value) => moveCandidateStage(candidate.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Current stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {job.workflowStages.map((stage) => (
                              <SelectItem key={stage.id} value={stage.id}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{candidate.aiEvaluation.summary}</p>
                      {candidate.profileKeywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate.profileKeywords.map((keyword) => (
                            <span key={keyword} className="rounded-full border border-border px-2 py-0.5 text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={job.status === "published" ? "outline" : "default"}
                  onClick={() => setJobStatus(job.id, job.status === "draft" ? "published" : "draft")}
                >
                  Set {job.status === "draft" ? "Published" : "Draft"}
                </Button>
                <Button
                  variant={job.isPublic ? "outline" : "default"}
                  onClick={() => setJobPublic(job.id, !job.isPublic)}
                >
                  Make {job.isPublic ? "Private" : "Public"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteJob(job.id);
                    window.location.assign("/app/jobs");
                  }}
                >
                  Delete Job
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Public: {job.isPublic ? "Yes" : "No"} · Status: {job.status}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
