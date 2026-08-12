import {
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

import type { DatePreset } from "../../../types/common";

type Job = {
  id: string;
  title: string;
  [key: string]: unknown;
};

type GlobalFiltersProps = {
  preset: DatePreset;
  setPreset: (preset: DatePreset) => void;
  jobFilter: string;
  setJobFilter: (filter: string) => void;
  customFrom: string;
  setCustomFrom: (from: string) => void;
  customTo: string;
  setCustomTo: (to: string) => void;
  jobs: Job[];
};

export const GlobalFilters = ({
  preset,
  setPreset,
  jobFilter,
  setJobFilter,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
  jobs,
}: GlobalFiltersProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Filters</CardTitle>
        <CardDescription>Date range and job filter apply to all sections.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date Range</p>
          <Select value={preset} onValueChange={(value: DatePreset) => setPreset(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Job Filter</p>
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</p>
              <Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</p>
              <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
