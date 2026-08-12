import { CheckCircle2 } from "lucide-react";

interface FormSuccessProps {
  message: string | null;
}

export function FormSuccess({ message }: FormSuccessProps): JSX.Element | null {
  if (!message) return null;

  return (
    <p className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </p>
  );
}
