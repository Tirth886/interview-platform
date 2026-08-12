import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@shared/ui";

interface CandidateCreateFormProps {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  error: string | null;
  message: string | null;
  queryError: boolean;
  queryErrorMessage?: string;
  isLoading: boolean;
  onSubmit: () => void;
}

export function CandidateCreateForm({
  phoneNumber,
  onPhoneNumberChange,
  name,
  onNameChange,
  email,
  onEmailChange,
  error,
  message,
  queryError,
  queryErrorMessage,
  isLoading,
  onSubmit,
}: CandidateCreateFormProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Candidate</CardTitle>
        <CardDescription>
          Phone number is required. Name and email are optional for now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(event.target.value)}
            placeholder="Phone number *"
          />
          <Input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Name (optional)"
          />
          <Input
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Email (optional)"
            type="email"
          />
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {queryError ? (
          <p className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {queryErrorMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Candidate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
