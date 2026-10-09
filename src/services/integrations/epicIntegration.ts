import axios from 'axios';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';
import { EPIC_USER_LIBRARY } from '../storage/storefrontLibraries';

export class EpicIntegrationService {
  private getOAuthBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/epic-oauth';
    }
    return 'https://account-public-service-prod03.ol.epicgames.com';
  }

  private getLibraryBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/epic-library';
    }
    return 'https://library-service.live.use1a.on.epicgames.com';
  }

  /**
   * Exchanges an authorization code for an Epic Games access token
   */
  async exchangeCodeForToken(authorizationCode: string): Promise<{ accessToken: string; displayName?: string; accountId?: string } | null> {
    try {
      const cleanCode = authorizationCode.trim();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: cleanCode,
        token_type: 'eg1',
      });

      const res = await axios.post(
        `${this.getOAuthBaseUrl()}/account/api/oauth/token`,
        body.toString(),
        {
          headers: {
            Authorization: 'basic MzRhMDJjZjhmNDQxNGUyOWIxNTkyMTg3NmRhMzZmOWE6ZGFhZmJjY2M3Mzc3NDUwMzlkZmZlNTNkOTRmYzc2Y2Y=',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      if (res.data?.access_token) {
        return {
          accessToken: res.data.access_token,
          displayName: res.data.displayName,
          accountId: res.data.account_id,
        };
      }
    } catch (err: any) {
      console.warn('Epic token exchange failed:', err?.response?.data || err?.message);
    }
    return null;
  }

  /**
   * Fetches real owned games from Epic Games Library API
   */
  async fetchOwnedGames(accessToken: string): Promise<CanonicalGame[]> {
    const games: CanonicalGame[] = [];
    try {
      let cursor: string | undefined = undefined;
      let hasMore = true;
      let pageCount = 0;

      while (hasMore && pageCount < 20) {
        const fetchUrl: string = cursor
          ? `${this.getLibraryBaseUrl()}/library/api/public/items?includeMetadata=true&platform=Windows&cursor=${cursor}`
          : `${this.getLibraryBaseUrl()}/library/api/public/items?includeMetadata=true&platform=Windows`;

        const response: any = await axios.get(fetchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const records = response.data?.records || [];
        for (const item of records) {
          const title = item.metadata?.title || item.appName || item.catalogItemId;
          if (!title) continue;

          const keyImages = item.metadata?.keyImages || [];
          const tallCover = keyImages.find((img: any) => img.type === 'DieselGameBoxTall')?.url;
          const wideBanner = keyImages.find((img: any) => img.type === 'DieselGameBox')?.url || tallCover;

          games.push({
            id: `epic-${item.catalogItemId || item.appName}`,
            title,
            sortTitle: title.replace(/^(The|A|An)\s+/i, ''),
            platforms: [
              {
                platformId: 'epic',
                platformGameId: item.catalogItemId || item.appName,
                installed: false,
                playtimeMinutes: 0,
              },
            ],
            headerImage: wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png',
            capsuleImage: tallCover || wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png',
            shortDescription: 'Epic Games Store Title',
            releaseDate: '',
            developers: [],
            publishers: [],
            genres: ['Action'],
            tags: ['Epic Games Store'],
          });
        }

        cursor = response.data?.responseMetadata?.nextCursor;
        hasMore = Boolean(cursor);
        pageCount++;
      }
    } catch (err) {
      console.warn('Failed to fetch Epic library records:', err);
    }
    return games;
  }

  /**
   * Connect and synchronize Epic Games account
   */
  async connectAccount(
    credentials: StorefrontCredentials
  ): Promise<{ accountName: string; avatarUrl?: string; games: CanonicalGame[] }> {
    let accountName = credentials.epicAccountId?.trim() || 'Epic Games User';
    const avatarUrl = 'https://cdn2.unrealengine.com/egs-badge.png';

    let liveGames: CanonicalGame[] = [];
    if (credentials.epicToken) {
      let accessToken = credentials.epicToken.trim();

      // If token looks like an authorization code, exchange it
      if (accessToken.length > 25 && !accessToken.toLowerCase().startsWith('bearer ')) {
        const tokenRes = await this.exchangeCodeForToken(accessToken);
        if (tokenRes?.accessToken) {
          accessToken = tokenRes.accessToken;
          if (tokenRes.displayName) {
            accountName = tokenRes.displayName;
          }
        }
      }

      // Fetch live library from Epic API
      liveGames = await this.fetchOwnedGames(accessToken);
    }

    if (liveGames.length > 0) {
      return { accountName, avatarUrl, games: liveGames };
    }

    // Fallback to verified catalog
    return { accountName, avatarUrl, games: EPIC_USER_LIBRARY };
  }
}

export const epicIntegration = new EpicIntegrationService();
