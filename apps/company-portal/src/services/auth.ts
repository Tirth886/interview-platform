import { companyHttpClient } from './http';
import type {
  LoginInput,
  Session,
  SignupInput,
  VerifyEmailInput,
} from '../types/auth';

const AUTH_BASE_PATH = '/api/v1/auth';

type ApiEnvelope<T> = {
  status: 'success' | 'error';
  message: string;
  data: T;
};

type SignupResponseData = {
  email: string;
  verificationRequired: boolean;
  verificationChannel: 'email';
};

type SigninResponseData =
  | {
      session: Session;
      refreshToken: string;
    }
  | {
      verificationRequired: true;
      email: string;
    };

type VerifyEmailResponseData = {
  session: Session;
  refreshToken: string;
};

type ResendVerificationResponseData = {
  email: string;
  resent: true;
};

type HttpErrorLike = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

export class AuthError extends Error {
  code: 'DUPLICATE_EMAIL' | 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'INVALID_CODE';
  metadata?: Record<string, string>;

  constructor(
    code: 'DUPLICATE_EMAIL' | 'INVALID_CREDENTIALS' | 'EMAIL_NOT_VERIFIED' | 'INVALID_CODE',
    message: string,
    metadata?: Record<string, string>
  ) {
    super(message);
    this.code = code;
    this.metadata = metadata;
  }
}

const mapErrorToAuthError = (error: unknown, fallback: string): AuthError => {
  if (error instanceof AuthError) {
    return error;
  }

  const httpError = error as HttpErrorLike;
  if (httpError?.response) {
    const message = httpError.response.data?.message ?? fallback;
    const status = httpError.response.status;

    if (status === 409) {
      return new AuthError('DUPLICATE_EMAIL', message);
    }

    if (status === 401) {
      return new AuthError('INVALID_CREDENTIALS', message);
    }

    if (status === 400 && /verification|code|expired|invalid/i.test(message)) {
      return new AuthError('INVALID_CODE', message);
    }

    return new AuthError('INVALID_CREDENTIALS', message);
  }

  if (error instanceof Error) {
    return new AuthError('INVALID_CREDENTIALS', error.message);
  }

  return new AuthError('INVALID_CREDENTIALS', fallback);
};

export const signup = async (
  input: SignupInput
): Promise<{ email: string; verificationCodeHint: string | null }> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<SignupResponseData>>(
      `${AUTH_BASE_PATH}/signup`,
      input
    );

    return {
      email: response.data.data.email,
      verificationCodeHint: null,
    };
  } catch (error) {
    throw mapErrorToAuthError(error, 'Unable to create your account right now.');
  }
};

export const login = async (
  input: LoginInput
): Promise<{ session?: Session; verificationCodeHint?: string | null; email?: string }> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<SigninResponseData>>(
      `${AUTH_BASE_PATH}/signin`,
      input
    );

    const data = response.data.data;

    if (!('session' in data)) {
      throw new AuthError('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in.', {
        email: data.email,
      });
    }

    return {
      session: data.session,
      email: data.session.user.email,
      verificationCodeHint: null,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw mapErrorToAuthError(error, 'Something went wrong while logging in.');
  }
};

export const verifyEmail = async (
  input: VerifyEmailInput
): Promise<{ session: Session }> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<VerifyEmailResponseData>>(
      `${AUTH_BASE_PATH}/verify-email`,
      input
    );

    return {
      session: response.data.data.session,
    };
  } catch (error) {
    throw mapErrorToAuthError(error, 'Unable to verify email at the moment.');
  }
};

export const resendVerification = async (
  rawEmail: string
): Promise<{ email: string; verificationCodeHint: string | null }> => {
  try {
    const response = await companyHttpClient.post<ApiEnvelope<ResendVerificationResponseData>>(
      `${AUTH_BASE_PATH}/resend-verification`,
      {
        email: rawEmail,
      }
    );

    return {
      email: response.data.data.email,
      verificationCodeHint: null,
    };
  } catch (error) {
    throw mapErrorToAuthError(error, 'Unable to resend verification code.');
  }
};

export const isSessionExpired = (session: Session | null): boolean => {
  if (!session) {
    return true;
  }
  return session.expiresAt <= Date.now();
};
