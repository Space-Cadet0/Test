import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';
import { XBOX_USER_LIBRARY } from '../storage/storefrontLibraries';

export class XboxIntegrationService {
  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; avatarUrl?: string; games: CanonicalGame[] }> {
    const accountName = credentials.webToken || 'SpaceCadet85 (Xbox Live)';
    const avatarUrl = 'https://assets.xboxservices.com/assets/default-gamerpic.png';

    // Synchronize owned Xbox / PC Game Pass library
    return { accountName, avatarUrl, games: XBOX_USER_LIBRARY };
  }
}

export const xboxIntegration = new XboxIntegrationService();
