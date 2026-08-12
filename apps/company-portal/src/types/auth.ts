export type UserRole = "admin" | "recruiter";

export type CompanySize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";

export type CompanyProfile = {
  name: string;
  domain: string;
  size: CompanySize;
};

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  company: CompanyProfile;
  emailVerified: boolean;
  createdAt: string;
};

export type Session = {
  token: string;
  expiresAt: number;
  user: AuthUser;
};

export type SignupInput = {
  email: string;
  password: string;
  role: UserRole;
  company: CompanyProfile;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type VerifyEmailInput = {
  email: string;
  code: string;
};
