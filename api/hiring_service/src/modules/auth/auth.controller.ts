import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS } from '../../constants/http';
import { sendSuccess } from '../../middlewares/response';
import { logger } from '../../middlewares/logger';
import { env } from '../../config/env';
import { AuthService, authService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @openapi
   * /api/v1/auth/signup:
   *   post:
   *     tags: [Auth]
   *     summary: Register a new company and admin account
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password, role, company]
   *             properties:
   *               email:       { type: string, format: email }
   *               password:    { type: string, minLength: 8 }
   *               role:        { type: string, enum: [admin, company_admin, team_member, recruiter] }
   *               company:
   *                 type: object
   *                 required: [name, domain, size]
   *                 properties:
   *                   name:   { type: string }
   *                   domain: { type: string }
   *                   size:   { type: string, enum: [1-10, 11-50, 51-200, 201-500, 500+] }
   *     responses:
   *       201: { description: Account created }
   *       400: { description: Validation error or email already registered }
   */
  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const result = await this.authService.signup(input);
      sendSuccess(res, 'Account created successfully', result, HTTP_STATUS.CREATED);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/signin:
   *   post:
   *     tags: [Auth]
   *     summary: Sign in with email and password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:    { type: string, format: email }
   *               password: { type: string }
   *     responses:
   *       200: { description: Signed in, returns access and refresh tokens }
   *       401: { description: Invalid credentials }
   */
  signin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const result = await this.authService.signin(input);
      sendSuccess(res, 'Signed in successfully', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/verify-email:
   *   post:
   *     tags: [Auth]
   *     summary: Verify email using a 6-digit code and create session
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, code]
   *             properties:
   *               email: { type: string, format: email }
   *               code: { type: string, example: "123456" }
   *     responses:
   *       200: { description: Email verified and session created }
   *       400: { description: Invalid or expired verification code }
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const result = await this.authService.verifyEmail(input);
      sendSuccess(res, 'Email verified successfully', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/resend-verification:
   *   post:
   *     tags: [Auth]
   *     summary: Regenerate and resend email verification code
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email: { type: string, format: email }
   *     responses:
   *       200: { description: Verification code regenerated }
   *       404: { description: Account not found }
   */
  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body;
      const result = await this.authService.resendVerification(input);
      sendSuccess(res, 'Verification code resent', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/refresh:
   *   post:
   *     tags: [Auth]
   *     summary: Refresh access token using a refresh token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200: { description: New token pair issued }
   *       401: { description: Invalid or expired refresh token }
   */
  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await this.authService.refresh(refreshToken);
      sendSuccess(res, 'Tokens refreshed', result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/signout:
   *   post:
   *     tags: [Auth]
   *     summary: Revoke a refresh token (sign out)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [refreshToken]
   *             properties:
   *               refreshToken: { type: string }
   *     responses:
   *       200: { description: Signed out }
   */
  signout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await this.authService.signout(refreshToken);
      sendSuccess(res, 'Signed out successfully', null);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/me:
   *   get:
   *     tags: [Auth]
   *     summary: Get currently authenticated user profile
   *     responses:
   *       200: { description: Auth user profile returned }
   *       401: { description: Missing or invalid access token }
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getMe(req.auth!.userId, req.auth!.companyId);
      sendSuccess(res, 'Auth profile fetched successfully', { user });
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/sso/{provider}:
   *   get:
   *     tags: [Auth]
   *     summary: Initiate SSO login and return provider authorization URL
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema: { type: string, enum: [google, microsoft] }
   *     responses:
   *       200: { description: Provider authorization URL returned }
   *       400: { description: Invalid provider }
   */
  ssoInitiate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = req.params['provider'] as 'google' | 'microsoft';
      const { url } = this.authService.generateSsoUrl(provider);
      sendSuccess(res, 'SSO authorization URL generated', { redirectUrl: url }, HTTP_STATUS.OK);
    } catch (err) {
      next(err);
    }
  };

  /**
   * @openapi
   * /api/v1/auth/sso/{provider}/callback:
   *   get:
   *     tags: [Auth]
   *     summary: SSO provider callback and return frontend redirect URL with auth tokens
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema: { type: string, enum: [google, microsoft] }
   *       - in: query
   *         name: code
   *         required: true
   *         schema: { type: string }
   *       - in: query
   *         name: state
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Callback processed successfully and redirect URL returned }
   *       401: { description: Invalid or expired SSO state }
   */
  ssoCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const provider = req.params['provider'] as 'google' | 'microsoft';
      const { code, state } = req.query as { code: string; state: string };
      const result = await this.authService.handleSsoCallback(provider, code, state);

      // Tokens in hash fragment — not sent to server, avoids logging
      const redirectUrl = new URL('/auth/sso/callback', env.FRONTEND_URL);
      redirectUrl.hash = `access_token=${result.tokens.accessToken}&refresh_token=${result.tokens.refreshToken}`;
      sendSuccess(
        res,
        'SSO callback processed successfully',
        { redirectUrl: redirectUrl.toString() },
        HTTP_STATUS.OK
      );
    } catch (err) {
      logger.warn({ err }, 'SSO callback failed');
      next(err);
    }
  };
}

export const authController = new AuthController(authService);
