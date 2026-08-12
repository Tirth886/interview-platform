import { SsoProvider } from '../../types/auth.types';
import { GoogleSsoProvider } from './google.provider';
import { MicrosoftSsoProvider } from './microsoft.provider';
import { ISsoProvider } from './sso-provider.interface';

export function getSsoProvider(provider: SsoProvider): ISsoProvider {
  switch (provider) {
    case 'google':
      return new GoogleSsoProvider();
    case 'microsoft':
      return new MicrosoftSsoProvider();
    default:
      throw new Error(`Unknown SSO provider: ${provider}`);
  }
}

export { ISsoProvider };
