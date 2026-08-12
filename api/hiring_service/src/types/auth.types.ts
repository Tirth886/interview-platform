export interface Company {
  id: string;
  name: string;
  domain: string;
  size: CompanySize;
  created_at: Date;
  updated_at: Date;
}

export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';
export type UserRole = 'admin' | 'company_admin' | 'team_member';
export type ApiUserRole = 'admin' | 'recruiter';

export interface User {
  id: string;
  company_id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  role: UserRole;
  email_verified: boolean;
  email_verification_code: string | null;
  email_verification_expires_at: Date | null;
  sso_provider: string | null;
  sso_subject: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  role: ApiUserRole;
  company: {
    name: string;
    domain: string;
    size: CompanySize;
  };
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  expiresAt: number;
  user: AuthUser;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Omit<User, 'password_hash'>;
  tokens: AuthTokens;
}

export type SsoProvider = 'google' | 'microsoft';

export interface SsoProfile {
  email: string;
  fullName: string;
  subject: string;
}
