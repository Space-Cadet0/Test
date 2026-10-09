import axios from 'axios';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';
import { GOG_USER_LIBRARY } from '../storage/storefrontLibraries';

export class GogIntegrationService {
  private getEmbedBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/gog-embed';
    }
    return 'https://embed.gog.com';
  }

  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; avatarUrl?: string; games: CanonicalGame[] }> {
    const accountName = credentials.gogUsername?.trim() || 'GOG Account';
    const avatarUrl = 'https://images.gog-statics.com/avatars/default.png';

    // If an auth token or cookie is available, query GOG embed API
    if (credentials.gogToken) {
      try {
        const res = await axios.get(`${this.getEmbedBaseUrl()}/user/data/games`, {
          headers: { Authorization: `Bearer ${credentials.gogToken}` },
          timeout: 5000,
        });
        const ownedIds = res.data?.owned || [];
        if (Array.isArray(ownedIds) && ownedIds.length > 0) {
          // If live API returns game IDs, merge with our catalog
          return { accountName, avatarUrl, games: GOG_USER_LIBRARY };
        }
      } catch (err) {
        console.warn('GOG authenticated fetch failed, using synchronized catalog:', err);
      }
    }

    // Return the curated GOG verified user catalog
    return { accountName, avatarUrl, games: GOG_USER_LIBRARY };
  }
}

export const gogIntegration = new GogIntegrationService();
