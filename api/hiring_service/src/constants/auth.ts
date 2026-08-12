// Token expiry constants (in days)
export const REFRESH_TOKEN_EXPIRES_DAYS = 7;

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  COMPANY_ADMIN: 'company_admin',
  TEAM_MEMBER: 'team_member',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
