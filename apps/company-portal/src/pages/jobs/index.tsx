import { useMemo, useState } from "react";
import { useJobManagementStore } from "../../stores/useJobManagementStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { JobFormState, JobFormStep, JobWorkflowStage } from "../../types/jobs";
import { buildFallbackWorkflow, createLocalId, emptyJobForm, getDefaultStageColor } from "../../utils/jobUtils";
import { JobsToolbar } from "./components/JobsToolbar";
import { JobListSection } from "./components/JobListSection";
import { JobFormSection } from "./components/JobFormSection";

export default function JobsPage(): JSX.Element {
  const jobs = useJobManagementStore((state) => state.jobs);
  const candidates = useJobManagementStore((state) => state.candidates);
  const createJob = useJobManagementStore((state) => state.createJob);
  const updateJob = useJobManagementStore((state) => state.updateJob);
  const deleteJob = useJobManagementStore((state) => state.deleteJob);

  const general = useSettingsStore((state) => state.general);
  const masterData = useSettingsStore((state) => state.masterData);
  const workflows = useSettingsStore((state) => state.workflows);
  const transitionRules = useSettingsStore((state) => state.transitionRules);
  const aiAgents = useSettingsStore((state) => state.aiAgents);

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [stageToAdd, setStageToAdd] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [atsInput, setAtsInput] = useState("");
  const [activeStep, setActiveStep] = useState<JobFormStep>(1);

  const [form, setForm] = useState<JobFormState>(() =>
    emptyJobForm(general.defaultInterviewDurationMinutes, general.defaultHiringFlow)
  );

  const jobsSorted = useMemo(
    () => [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [jobs]
  );

  const candidateCountByJob = useMemo(() => {
    return candidates.reduce<Record<string, number>>((acc, candidate) => {
      acc[candidate.jobId] = (acc[candidate.jobId] ?? 0) + 1;
      return acc;
    }, {});
  }, [candidates]);

  const stageTemplateMap = useMemo(
    () => new Map(masterData.stages.map((stage) => [stage.id, stage])),
    [masterData.stages]
  );

  const transitionRuleMap = useMemo(
    () => new Map(transitionRules.map((item) => [item.stageId, item.rule])),
    [transitionRules]
  );

  const aiAgentMap = useMemo(
    () => new Map(aiAgents.map((agent) => [agent.id, agent.name])),
    [aiAgents]
  );

  const applyWorkflowForDesignation = (designationId: string): JobWorkflowStage[] => {
    const mapping = workflows.find((w) => w.designationId === designationId);
    if (!mapping || mapping.stages.length === 0) {
      return buildFallbackWorkflow(
        general.defaultInterviewDurationMinutes,
        general.defaultHiringFlow
      );
    }

    return mapping.stages.reduce<JobWorkflowStage[]>((acc, item) => {
      const stage = stageTemplateMap.get(item.stageId);
      if (!stage) {
        return acc;
      }
      acc.push({
        id: createLocalId(),
        stageTemplateId: stage.id,
        aiAgentId: item.aiAgentId,
        name: stage.name,
        type: stage.type,
        colorHex: stage.colorHex ?? getDefaultStageColor(stage.type),
        durationMinutes: stage.durationMinutes,
        transitionRule: transitionRuleMap.get(stage.id),
      });
      return acc;
    }, []);
  };

  const startCreate = (): void => {
    setMode("create");
    setActiveStep(1);
    setEditingId(null);
    setForm(emptyJobForm(general.defaultInterviewDurationMinutes, general.defaultHiringFlow));
    setFormError(null);
    setMessage(null);
  };

  const startEdit = (jobId: string): void => {
    const job = jobs.find((item) => item.id === jobId);
    if (!job) {
      return;
    }

    setMode("edit");
    setActiveStep(1);
    setEditingId(job.id);
    setForm({
      title: job.title,
      description: job.description,
      skillKeywords: job.skillKeywords,
      atsKeywords: job.atsKeywords,
      expectedAtsScore: String(job.expectedAtsScore),
      departmentId: job.departmentId,
      designationId: job.designationId,
      experienceMinYears: String(job.experienceMinYears),
      experienceMaxYears: String(job.experienceMaxYears),
      location: job.location,
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
      salaryCurrency: job.salaryCurrency,
      isPublic: job.isPublic,
      status: job.status,
      workflowStages: job.workflowStages,
    });
    setFormError(null);
    setMessage(null);
  };

  const saveJob = (): void => {
    if (!form.title.trim()) {
      setFormError("Job title is required");
      return;
    }
    if (!form.departmentId || !form.designationId) {
      setFormError("Department and designation are required");
      return;
    }
    if (form.workflowStages.length === 0) {
      setFormError("Workflow needs at least one stage");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      skillKeywords: form.skillKeywords,
      atsKeywords: form.atsKeywords,
      expectedAtsScore: Math.min(100, Math.max(0, Number(form.expectedAtsScore) || 0)),
      departmentId: form.departmentId,
      designationId: form.designationId,
      experienceMinYears: Math.max(0, Number(form.experienceMinYears) || 0),
      experienceMaxYears: Math.max(
        Number(form.experienceMinYears) || 0,
        Number(form.experienceMaxYears) || 0
      ),
      location: form.location.trim(),
      salaryMin: form.salaryMin.trim() ? Number(form.salaryMin) : null,
      salaryMax: form.salaryMax.trim() ? Number(form.salaryMax) : null,
      salaryCurrency: form.salaryCurrency,
      isPublic: form.isPublic,
      status: form.status,
      workflowStages: form.workflowStages,
    };

    if (mode === "create") {
      const id = createJob(payload);
      setMessage("Job created");
      setMode("list");
      setEditingId(id);
      setFormError(null);
      return;
    }

    if (!editingId) {
      setFormError("No job selected for update");
      return;
    }

    const result = updateJob(editingId, payload);
    if (!result.ok) {
      setFormError(result.reason ?? "Unable to update job");
      return;
    }
    setMessage("Job updated");
    setMode("list");
    setFormError(null);
  };

  const goToNextStep = (): void => {
    if (activeStep === 1) {
      if (!form.title.trim()) {
        setFormError("Job title is required");
        return;
      }
      if (!form.departmentId || !form.designationId) {
        setFormError("Department and designation are required");
        return;
      }
    }

    if (activeStep === 4) {
      const minY = Number(form.experienceMinYears) || 0;
      const maxY = Number(form.experienceMaxYears) || 0;
      if (maxY < minY) {
        setFormError("Experience max must be greater than or equal to min");
        return;
      }
    }

    if (activeStep === 3) {
      const score = Number(form.expectedAtsScore);
      if (Number.isNaN(score) || score < 0 || score > 100) {
        setFormError("Expected ATS score must be between 0 and 100");
        return;
      }
    }

    if (activeStep === 5 && form.workflowStages.length === 0) {
      setFormError("Workflow needs at least one stage");
      return;
    }

    setFormError(null);
    setActiveStep((prev) => (prev < 6 ? ((prev + 1) as JobFormStep) : prev));
  };

  const goToPreviousStep = (): void => {
    setFormError(null);
    setActiveStep((prev) => (prev > 1 ? ((prev - 1) as JobFormStep) : prev));
  };

  const tryAutoFillSalary = (): void => {
    const minY = Number(form.experienceMinYears) || 0;
    const maxY = Number(form.experienceMaxYears) || 0;
    const matched = masterData.payScales.find(
      (rule) => minY >= rule.minExperienceYears && maxY <= rule.maxExperienceYears
    );
    if (!matched) {
      setFormError("No matching pay scale rule found");
      return;
    }
    setForm((prev) => ({
      ...prev,
      salaryMin: String(matched.minSalary),
      salaryMax: String(matched.maxSalary),
      salaryCurrency: matched.currency,
    }));
    setFormError(null);
  };

  const copyPublicLink = async (slug: string): Promise<void> => {
    const url = `${window.location.origin}/jobs/${slug}`;
    await navigator.clipboard.writeText(url);
    setMessage("Public link copied");
  };

  return (
    <div className="space-y-4">
      <JobsToolbar
        mode={mode}
        onCreate={startCreate}
        onBackToList={() => setMode("list")}
      />

      {message && <p className="text-sm text-emerald-700">{message}</p>}

      {mode !== "list" && (
        <JobFormSection
          mode={mode}
          form={form}
          setForm={setForm}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          skillInput={skillInput}
          setSkillInput={setSkillInput}
          atsInput={atsInput}
          setAtsInput={setAtsInput}
          stageToAdd={stageToAdd}
          setStageToAdd={setStageToAdd}
          formError={formError}
          setFormError={setFormError}
          masterData={masterData}
          aiAgents={aiAgents}
          stageTemplateMap={stageTemplateMap}
          transitionRuleMap={transitionRuleMap}
          aiAgentMap={aiAgentMap}
          applyWorkflowForDesignation={applyWorkflowForDesignation}
          tryAutoFillSalary={tryAutoFillSalary}
          goToNextStep={goToNextStep}
          goToPreviousStep={goToPreviousStep}
          saveJob={saveJob}
          onCancel={() => setMode("list")}
        />
      )}

      {mode === "list" && (
        <JobListSection
          jobs={jobsSorted}
          candidateCountByJob={candidateCountByJob}
          onEdit={startEdit}
          onDelete={deleteJob}
          onCopyPublicLink={(slug) => {
            void copyPublicLink(slug);
          }}
        />
      )}
    </div>
  );
}
