import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message: string | null;
}

export function FormError({ message }: FormErrorProps): JSX.Element | null {
  if (!message) return null;

  return (
    <p className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" />
      {message}
    </p>
  );
}
