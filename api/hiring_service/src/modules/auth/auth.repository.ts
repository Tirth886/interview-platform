import { PoolClient } from 'pg';
import { db } from '../../providers/database';
import { Company, CompanySize, RefreshToken, User, UserRole } from '../../types/auth.types';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const result = await db.query<User>('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
    return result.rows[0] ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await db.query<User>('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ?? null;
  }

  async findCompanyById(id: string): Promise<Company | null> {
    const result = await db.query<Company>('SELECT * FROM companies WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ?? null;
  }

  async findUserBySso(provider: string, subject: string): Promise<User | null> {
    const result = await db.query<User>(
      'SELECT * FROM users WHERE sso_provider = $1 AND sso_subject = $2 LIMIT 1',
      [provider, subject]
    );
    return result.rows[0] ?? null;
  }

  async createCompany(
    data: { name: string; domain: string; size: CompanySize },
    client?: PoolClient
  ): Promise<Company> {
    const result = await (client ?? db).query<Company>(
      'INSERT INTO companies (name, domain, size) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.domain, data.size]
    );
    return result.rows[0];
  }

  async createUser(
    data: {
      companyId: string;
      email: string;
      passwordHash: string | null;
      fullName: string;
      role: UserRole;
      emailVerified: boolean;
      emailVerificationCode: string | null;
      emailVerificationExpiresAt: Date | null;
      ssoProvider: string | null;
      ssoSubject: string | null;
    },
    client?: PoolClient
  ): Promise<User> {
    const result = await (client ?? db).query<User>(
      `INSERT INTO users (
        company_id,
        email,
        password_hash,
        full_name,
        role,
        email_verified,
        email_verification_code,
        email_verification_expires_at,
        sso_provider,
        sso_subject
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.companyId,
        data.email,
        data.passwordHash,
        data.fullName,
        data.role,
        data.emailVerified,
        data.emailVerificationCode,
        data.emailVerificationExpiresAt,
        data.ssoProvider,
        data.ssoSubject,
      ]
    );
    return result.rows[0];
  }

  async updateEmailVerification(userId: string, code: string, expiresAt: Date): Promise<void> {
    await db.query(
      `UPDATE users
       SET email_verification_code = $2,
           email_verification_expires_at = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, code, expiresAt]
    );
  }

  async markEmailVerified(userId: string): Promise<void> {
    await db.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verification_code = NULL,
           email_verification_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    const result = await db.query<RefreshToken>(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1',
      [tokenHash]
    );
    return result.rows[0] ?? null;
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }
}

export const authRepository = new AuthRepository();
