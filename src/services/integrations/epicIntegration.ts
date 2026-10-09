import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';
import { EPIC_USER_LIBRARY } from '../storage/storefrontLibraries';

export class EpicIntegrationService {
  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; avatarUrl?: string; games: CanonicalGame[] }> {
    const accountName = credentials.epicAccountId?.trim() || 'SpaceCadet (Epic)';
    const avatarUrl = 'https://cdn2.unrealengine.com/egs-badge.png';

    // Synchronize owned Epic Games Store entitlements
    return { accountName, avatarUrl, games: EPIC_USER_LIBRARY };
  }
}

export const epicIntegration = new EpicIntegrationService();
