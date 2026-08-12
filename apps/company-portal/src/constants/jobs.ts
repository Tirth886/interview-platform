import type { JobFormStep } from "../types/jobs";

export const jobFormSteps: { id: JobFormStep; label: string }[] = [
  { id: 1, label: "Basic" },
  { id: 2, label: "Skills" },
  { id: 3, label: "ATS" },
  { id: 4, label: "Compensation" },
  { id: 5, label: "Workflow" },
  { id: 6, label: "Review" },
];
