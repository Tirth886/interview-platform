import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../middlewares/errors';
import { withTransaction } from '../../providers/database';
import { AuthRepository, authRepository } from './auth.repository';
import { ResendVerificationInput, SigninInput, SignupInput, VerifyEmailInput } from './auth.schema';
import { getSsoProvider } from '../../providers/sso';
import { AuthResult, AuthUser, Session, SsoProvider } from '../../types/auth.types';
import {
  buildAuthUser,
  extractCompanyFromEmail,
  extractNameFromEmail,
  normalizeRole,
  generateTokens,
  getRefreshTokenExpiryDate,
  hashToken,
} from '../../utils/auth';

const BCRYPT_ROUNDS = 12;
const VERIFICATION_CODE_TTL_MINUTES = 10;

type SignupResponse = {
  email: string;
  verificationRequired: boolean;
  verificationChannel: 'email';
};

type SigninSuccessResponse = {
  session: Session;
  refreshToken: string;
};

type SigninVerificationRequiredResponse = {
  verificationRequired: true;
  email: string;
};

type RefreshResponse = {
  token: string;
  expiresAt: number;
  refreshToken: string;
};

type ResendVerificationResponse = {
  email: string;
  resent: true;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  private createVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getVerificationExpiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_CODE_TTL_MINUTES);
    return expiresAt;
  }

  private getSessionExpiryEpochMs(): number {
    return Date.now() + env.JWT_ACCESS_EXPIRES_IN * 1000;
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiryDate();
    await this.authRepository.createRefreshToken(userId, tokenHash, expiresAt);
  }

  async signup(input: SignupInput): Promise<SignupResponse> {
    const existing = await this.authRepository.findUserByEmail(input.email);
    if (existing) throw new ValidationError('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const fullName = extractNameFromEmail(input.email);
    const verificationCode = this.createVerificationCode();
    const verificationExpiresAt = this.getVerificationExpiryDate();

    const { company, user } = await withTransaction(async (client) => {
      const company = await this.authRepository.createCompany(
        {
          name: input.company.name,
          domain: input.company.domain,
          size: input.company.size,
        },
        client
      );

      const user = await this.authRepository.createUser(
        {
          companyId: company.id,
          email: input.email,
          passwordHash,
          fullName,
          role: normalizeRole(input.role),
          emailVerified: false,
          emailVerificationCode: verificationCode,
          emailVerificationExpiresAt: verificationExpiresAt,
          ssoProvider: null,
          ssoSubject: null,
        },
        client
      );

      return { company, user };
    });

    void company;
    void user;

    return {
      email: input.email,
      verificationRequired: true,
      verificationChannel: 'email',
    };
  }

  async signin(
    input: SigninInput
  ): Promise<SigninSuccessResponse | SigninVerificationRequiredResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid credentials');

    if (!user.password_hash) {
      throw new UnauthorizedError(
        'This account uses SSO. Please sign in with Google or Microsoft.'
      );
    }

    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');

    if (!user.email_verified) {
      const verificationCode = this.createVerificationCode();
      const verificationExpiresAt = this.getVerificationExpiryDate();
      await this.authRepository.updateEmailVerification(
        user.id,
        verificationCode,
        verificationExpiresAt
      );
      return {
        verificationRequired: true,
        email: user.email,
      };
    }

    const company = await this.authRepository.findCompanyById(user.company_id);
    if (!company) throw new NotFoundError('Company not found');

    const tokens = generateTokens(user.id, company.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      session: {
        token: tokens.accessToken,
        expiresAt: this.getSessionExpiryEpochMs(),
        user: buildAuthUser(user, company),
      },
      refreshToken: tokens.refreshToken,
    };
  }

  async verifyEmail(input: VerifyEmailInput): Promise<SigninSuccessResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new ValidationError('Invalid or expired verification code');
    }

    if (user.email_verified) {
      const company = await this.authRepository.findCompanyById(user.company_id);
      if (!company) throw new NotFoundError('Company not found');
      const tokens = generateTokens(user.id, company.id);
      await this.storeRefreshToken(user.id, tokens.refreshToken);
      return {
        session: {
          token: tokens.accessToken,
          expiresAt: this.getSessionExpiryEpochMs(),
          user: buildAuthUser(user, company),
        },
        refreshToken: tokens.refreshToken,
      };
    }

    const codeMatches = user.email_verification_code === input.code;
    const isExpired =
      !user.email_verification_expires_at ||
      user.email_verification_expires_at.getTime() < Date.now();

    if (!codeMatches || isExpired) {
      throw new ValidationError('Invalid or expired verification code');
    }

    await this.authRepository.markEmailVerified(user.id);

    const refreshedUser = await this.authRepository.findUserById(user.id);
    if (!refreshedUser) throw new NotFoundError('User not found');

    const company = await this.authRepository.findCompanyById(refreshedUser.company_id);
    if (!company) throw new NotFoundError('Company not found');

    const tokens = generateTokens(refreshedUser.id, company.id);
    await this.storeRefreshToken(refreshedUser.id, tokens.refreshToken);

    return {
      session: {
        token: tokens.accessToken,
        expiresAt: this.getSessionExpiryEpochMs(),
        user: buildAuthUser(refreshedUser, company),
      },
      refreshToken: tokens.refreshToken,
    };
  }

  async resendVerification(input: ResendVerificationInput): Promise<ResendVerificationResponse> {
    const user = await this.authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new NotFoundError('Account not found');
    }

    if (user.email_verified) {
      throw new ValidationError('Email is already verified');
    }

    const verificationCode = this.createVerificationCode();
    const verificationExpiresAt = this.getVerificationExpiryDate();
    await this.authRepository.updateEmailVerification(
      user.id,
      verificationCode,
      verificationExpiresAt
    );

    return {
      email: user.email,
      resent: true,
    };
  }

  async getMe(userId: string, companyId: string): Promise<AuthUser> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.company_id !== companyId) {
      throw new UnauthorizedError('User does not belong to the authenticated company');
    }

    const company = await this.authRepository.findCompanyById(user.company_id);
    if (!company) {
      throw new UnauthorizedError('Company not found');
    }

    return buildAuthUser(user, company);
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    let payload: { sub: string; companyId: string };

    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        sub: string;
        companyId: string;
      };
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.authRepository.findRefreshToken(tokenHash);
    if (!stored) throw new UnauthorizedError('Refresh token revoked or expired');

    await this.authRepository.deleteRefreshToken(tokenHash);

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) throw new UnauthorizedError('User not found');

    const tokens = generateTokens(user.id, user.company_id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return {
      token: tokens.accessToken,
      expiresAt: this.getSessionExpiryEpochMs(),
      refreshToken: tokens.refreshToken,
    };
  }

  async signout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.authRepository.deleteRefreshToken(tokenHash);
  }

  generateSsoUrl(provider: SsoProvider): { url: string; state: string } {
    const state = jwt.sign({ nonce: crypto.randomUUID() }, env.JWT_SECRET, { expiresIn: '10m' });
    const ssoProviderClient = getSsoProvider(provider);
    const url = ssoProviderClient.buildAuthUrl(state);
    return { url, state };
  }

  async handleSsoCallback(provider: SsoProvider, code: string, state: string): Promise<AuthResult> {
    try {
      jwt.verify(state, env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired SSO state parameter');
    }

    const ssoProviderClient = getSsoProvider(provider);
    const profile = await ssoProviderClient.exchangeCodeForProfile(code);

    let user = await this.authRepository.findUserBySso(provider, profile.subject);

    if (!user) {
      const existingByEmail = await this.authRepository.findUserByEmail(profile.email);
      if (existingByEmail) {
        throw new ValidationError(
          'An account with this email already exists. Please sign in with your password.'
        );
      }

      const companyName = extractCompanyFromEmail(profile.email);
      const fullName = profile.fullName || extractNameFromEmail(profile.email);
      const companyDomain = profile.email.split('@')[1] ?? 'unknown.com';
      user = await withTransaction(async (client) => {
        const company = await this.authRepository.createCompany(
          {
            name: companyName,
            domain: companyDomain,
            size: '1-10',
          },
          client
        );

        return this.authRepository.createUser(
          {
            companyId: company.id,
            email: profile.email,
            passwordHash: null,
            fullName,
            role: 'admin',
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpiresAt: null,
            ssoProvider: provider,
            ssoSubject: profile.subject,
          },
          client
        );
      });
    }

    const tokens = generateTokens(user.id, user.company_id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    const { password_hash: passwordHash, ...safeUser } = user;
    void passwordHash;

    return {
      user: safeUser,
      tokens,
    };
  }
}

export const authService = new AuthService(authRepository);
