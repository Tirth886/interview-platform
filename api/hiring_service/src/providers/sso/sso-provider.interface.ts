import { SsoProfile } from '../../types/auth.types';

export interface ISsoProvider {
  buildAuthUrl(state: string): string;
  exchangeCodeForProfile(code: string): Promise<SsoProfile>;
}
