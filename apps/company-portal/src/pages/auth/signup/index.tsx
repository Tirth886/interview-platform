import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthError, signup } from "../../../services/auth";
import type { CompanySize, UserRole } from "../../../types/auth";
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

const companySizeOptions: CompanySize[] = ["1-10", "11-50", "51-200", "201-500", "500+"];

export default function SignupPage(): JSX.Element {
  const navigate = useNavigate();
  const setVerificationContext = useAuthStore((state) => state.setVerificationContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize>("1-10");
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: (result) => {
      setVerificationContext(result.email, result.verificationCodeHint);
      navigate(`/auth/verify?email=${encodeURIComponent(result.email)}`);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof AuthError || error instanceof Error
          ? error.message
          : "Unable to create your account right now.";
      setFormError(message);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setFormError(null);
    mutation.mutate({
      email,
      password,
      role,
      company: {
        name: companyName,
        domain: companyDomain,
        size: companySize,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Company Account</CardTitle>
        <CardDescription>
          Set up your company profile to access recruiter workflows and dashboards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="owner@company.com"
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
              autoComplete="new-password"
              placeholder="Create password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
              >
                <option value="admin">Admin (Company Owner)</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-size">Company Size</Label>
              <select
                id="company-size"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={companySize}
                onChange={(event) => setCompanySize(event.target.value as CompanySize)}
              >
                {companySizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              placeholder="Acme Inc"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-domain">Company Domain</Label>
            <Input
              id="company-domain"
              placeholder="acme.com"
              value={companyDomain}
              onChange={(event) => setCompanyDomain(event.target.value)}
              required
            />
          </div>

          <FormError message={formError} />

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating account..." : "Sign Up"}
          </Button>

          <SsoButtons />

          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/auth/login">
              Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
