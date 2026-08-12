import { z } from 'zod';

const companySizeSchema = z.enum(['1-10', '11-50', '51-200', '201-500', '500+']);
const userRoleSchema = z.enum(['admin', 'recruiter']);

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: userRoleSchema,
  company: z.object({
    name: z.string().min(1).max(255).trim(),
    domain: z.string().min(1).max(255).trim(),
    size: companySizeSchema,
  }),
});

export const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be a 6-digit number'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const signoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ssoProviderSchema = z.enum(['google', 'microsoft']);
export const ssoProviderParamsSchema = z.object({
  provider: ssoProviderSchema,
});

export const ssoCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type SsoProviderParamsInput = z.infer<typeof ssoProviderParamsSchema>;
export type SsoCallbackInput = z.infer<typeof ssoCallbackSchema>;
