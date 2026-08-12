import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { REFRESH_TOKEN_EXPIRES_DAYS, Role, ROLES } from '../constants/auth';
import { UnauthorizedError } from '../middlewares/errors';
import { ApiUserRole, AuthTokens, AuthUser, Company, User } from '../types/auth.types';

export type AuthContext = {
  userId: string;
  companyId: string;
};

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokens(userId: string, companyId: string): AuthTokens {
  const accessToken = jwt.sign({ sub: userId, companyId }, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    { sub: userId, companyId, jti: crypto.randomUUID() },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
}

export function toApiUserRole(role: Role | string): ApiUserRole {
  return role === ROLES.ADMIN ? 'admin' : 'recruiter';
}

export function buildAuthUser(user: User, company: Company): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: toApiUserRole(user.role),
    company: {
      name: company.name,
      domain: company.domain,
      size: company.size,
    },
    emailVerified: user.email_verified,
    createdAt: user.created_at.toISOString(),
  };
}

export function getAuthContextFromBearerToken(authorizationHeader?: string): AuthContext {
  const [scheme, token] = (authorizationHeader ?? '').split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; companyId: string };
    return {
      userId: payload.sub,
      companyId: payload.companyId,
    };
  } catch {
    throw new UnauthorizedError('Invalid access token');
  }
}

export function getRefreshTokenExpiryDate(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expiresAt;
}

export function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] ?? 'Unknown';
  const name = domain.split('.')[0] ?? domain;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function extractNameFromEmail(email: string): string {
  return email.split('@')[0] ?? 'User';
}

// Normalize legacy recruiter role to team_member
export function normalizeRole(role: string): Role {
  if (role === 'recruiter') return ROLES.TEAM_MEMBER;
  if (Object.values(ROLES).includes(role as Role)) {
    return role as Role;
  }
  return ROLES.TEAM_MEMBER;
}
