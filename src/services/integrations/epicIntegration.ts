import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';

export class EpicIntegrationService {
  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; games: CanonicalGame[] }> {
    const { epicAccountId } = credentials;
    const accountName = epicAccountId || 'Epic Games User';

    // Epic games connection handler
    return { accountName, games: [] };
  }
}

export const epicIntegration = new EpicIntegrationService();
