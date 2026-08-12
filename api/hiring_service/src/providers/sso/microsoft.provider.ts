import { env } from '../../config/env';
import { SsoProfile } from '../../types/auth.types';
import { ISsoProvider } from './sso-provider.interface';

export class MicrosoftSsoProvider implements ISsoProvider {
  buildAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      redirect_uri: env.MICROSOFT_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string): Promise<SsoProfile> {
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.MICROSOFT_CLIENT_ID,
          client_secret: env.MICROSOFT_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: env.MICROSOFT_CALLBACK_URL,
        }).toString(),
      }
    );

    if (!tokenResponse.ok) throw new Error('Failed to exchange code for tokens');

    const { id_token } = (await tokenResponse.json()) as { id_token: string };

    // Decode JWT (without verification for simplicity; in production, verify)
    const payload = JSON.parse(Buffer.from(id_token.split('.')[1]!, 'base64').toString());

    return {
      email: payload.email,
      fullName: payload.name,
      subject: payload.oid,
    };
  }
}
