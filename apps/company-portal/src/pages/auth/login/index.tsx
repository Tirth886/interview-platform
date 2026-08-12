import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthError, login } from "../../../services/auth";
import { useAuthStore } from "../../../stores/useAuthStore";
import { SsoButtons } from "../../../components/auth/SsoButtons";
import { FormError } from "../components";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@shared/ui";

type LocationState = {
  from?: string;
};

export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const setVerificationContext = useAuthStore((state) => state.setVerificationContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      if (result.session) {
        setSession(result.session);
        const redirectTo = (location.state as LocationState | null)?.from ?? "/app";
        navigate(redirectTo, { replace: true });
      }
    },
    onError: (error: unknown) => {
      if (error instanceof AuthError && error.code === "EMAIL_NOT_VERIFIED") {
        const verificationEmail = error.metadata?.email ?? email;
        const codeHint = error.metadata?.verificationCodeHint;
        setVerificationContext(verificationEmail, codeHint ?? null);
        navigate(`/auth/verify?email=${encodeURIComponent(verificationEmail)}`);
        return;
      }

      const message =
        error instanceof Error ? error.message : "Something went wrong while logging in.";
      setFormError(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFormError(null);
    mutation.mutate({ email, password });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to Company Portal</CardTitle>
        <CardDescription>
          Use your work email and password or your SSO-linked account credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <FormError message={formError} />

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Login"}
          </Button>

          <SsoButtons />

          <p className="text-sm text-muted-foreground">
            New company account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/auth/signup">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
