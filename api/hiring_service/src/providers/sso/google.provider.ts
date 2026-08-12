import { env } from '../../config/env';
import { SsoProfile } from '../../types/auth.types';
import { ISsoProvider } from './sso-provider.interface';

export class GoogleSsoProvider implements ISsoProvider {
  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<SsoProfile> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.GOOGLE_CALLBACK_URL,
      }).toString(),
    });

    if (!tokenResponse.ok) throw new Error('Failed to exchange code for tokens');

    const { id_token } = (await tokenResponse.json()) as { id_token: string };

    // Decode JWT (without verification for simplicity; in production, verify)
    const payload = JSON.parse(Buffer.from(id_token.split('.')[1]!, 'base64').toString());

    return {
      email: payload.email,
      fullName: payload.name,
      subject: payload.sub,
    };
  }
}
