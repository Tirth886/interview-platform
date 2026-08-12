import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@shared/ui";

interface CandidateBoardControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function CandidateBoardControls({
  search,
  onSearchChange,
}: CandidateBoardControlsProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Board Controls</CardTitle>
        <CardDescription>Search by name, email, or phone.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by name, email, or phone"
        />
        <button
          type="button"
          className="w-full rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Bulk import UI wiring is next"
        >
          + Bulk Import Candidates
        </button>
      </CardContent>
    </Card>
  );
}
