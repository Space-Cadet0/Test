import axios from 'axios';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';

export class GogIntegrationService {
  private getEmbedBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/gog-embed';
    }
    return 'https://embed.gog.com';
  }

  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; games: CanonicalGame[] }> {
    const { gogUsername, gogToken } = credentials;
    const accountName = gogUsername || 'GOG User';

    // If an auth token or cookie is available, query GOG embed API
    if (gogToken) {
      try {
        const res = await axios.get(`${this.getEmbedBaseUrl()}/user/data/games`, {
          headers: { Authorization: `Bearer ${gogToken}` },
          timeout: 8000,
        });
        const ownedIds = res.data?.owned || [];
        if (Array.isArray(ownedIds) && ownedIds.length > 0) {
          // Map products
          const games: CanonicalGame[] = ownedIds.map((id: number) => ({
            id: `gog-${id}`,
            title: `GOG Game ${id}`,
            sortTitle: `GOG Game ${id}`,
            platforms: [
              {
                platformId: 'gog',
                platformGameId: String(id),
                installed: false,
              },
            ],
            headerImage: 'https://images.gog.com/placeholder.jpg',
            shortDescription: '',
            releaseDate: 'TBA',
            developers: [],
            publishers: [],
            genres: [],
            tags: [],
          }));
          return { accountName, games };
        }
      } catch (err) {
        console.warn('GOG authenticated fetch failed:', err);
      }
    }

    return { accountName, games: [] };
  }
}

export const gogIntegration = new GogIntegrationService();
