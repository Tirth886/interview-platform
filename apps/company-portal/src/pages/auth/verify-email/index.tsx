import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthError, resendVerification, verifyEmail } from "../../../services/auth";
import { useAuthStore } from "../../../stores/useAuthStore";
import { FormError, FormSuccess } from "../components";
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

export default function VerifyEmailPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const verificationEmail = useAuthStore((state) => state.verificationEmail);
  const verificationCodeHint = useAuthStore((state) => state.verificationCodeHint);
  const setSession = useAuthStore((state) => state.setSession);
  const setVerificationContext = useAuthStore((state) => state.setVerificationContext);

  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const email = useMemo(
    () => searchParams.get("email") ?? verificationEmail ?? "",
    [searchParams, verificationEmail]
  );

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: (result) => {
      setSession(result.session);
      navigate("/app", { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AuthError || error instanceof Error
          ? error.message
          : "Unable to verify email at the moment.";
      setFormError(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (result) => {
      setVerificationContext(result.email, result.verificationCodeHint);
      setSuccessMessage("A new verification code was sent.");
      setFormError(null);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AuthError || error instanceof Error
          ? error.message
          : "Unable to resend verification code.";
      setFormError(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    verifyMutation.mutate({ email, code });
  };

  const handleResend = (): void => {
    setFormError(null);
    setSuccessMessage(null);
    resendMutation.mutate(email);
  };

  if (!email) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Required</CardTitle>
          <CardDescription>
            Start from signup or login to continue email verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/auth/signup">Go to Sign Up</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          {verificationCodeHint ? (
            <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
              Dev note: use code <span className="font-semibold">{verificationCodeHint}</span>
            </p>
          ) : null}

          <FormError message={formError} />

          <FormSuccess message={successMessage} />

          <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? "Verifying..." : "Verify Email"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={resendMutation.isPending}
            onClick={handleResend}
          >
            {resendMutation.isPending ? "Sending..." : "Resend Code"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link className="font-medium text-primary hover:underline" to="/auth/login">
              Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
