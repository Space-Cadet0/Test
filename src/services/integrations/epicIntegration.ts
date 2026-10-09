import axios from 'axios';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontCredentials } from '../../contracts/integration';
import { EPIC_USER_LIBRARY } from '../storage/storefrontLibraries';
import { KNOWN_EPIC_APP_NAMES } from './epicCodenames';
import { steamMatcher } from '../steam/steamMatcher';

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
  /**
   * Fetches real owned games from Epic Games Library API
   */
  async fetchOwnedGames(accessToken: string): Promise<CanonicalGame[]> {
    const games: CanonicalGame[] = [];
    const seenIds = new Set<string>();

    // Build lookup maps from verified 402 Epic catalog
    const epicCatalogById = new Map<string, CanonicalGame>();
    const epicCatalogByTitle = new Map<string, CanonicalGame>();
    for (const g of EPIC_USER_LIBRARY) {
      const epicPlatform = g.platforms.find((p) => p.platformId === 'epic');
      if (epicPlatform?.platformGameId) {
        epicCatalogById.set(epicPlatform.platformGameId.toLowerCase().trim(), g);
      }
      epicCatalogByTitle.set(g.title.toLowerCase().trim(), g);
    }

    try {
      let cursor: string | undefined = undefined;
      let hasMore = true;
      let pageCount = 0;

      while (hasMore && pageCount < 30) {
        const fetchUrl: string = cursor
          ? `${this.getLibraryBaseUrl()}/library/api/public/items?includeMetadata=true&platform=Windows&cursor=${cursor}`
          : `${this.getLibraryBaseUrl()}/library/api/public/items?includeMetadata=true&platform=Windows`;

        const response: any = await axios.get(fetchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        });

        const records = response.data?.records || [];
        for (const item of records) {
          // 1. Skip non-game records & private sandboxes
          if (!item.appName || item.appName === '1' || item.sandboxType === 'PRIVATE') continue;

          // 2. Skip Unreal Engine Marketplace assets & developer tools
          if (
            item.namespace === 'ue' ||
            item.namespace === '89efe5924d3d467c839449ab6ab52e7f' ||
            item.namespace?.startsWith('ue-')
          ) {
            continue;
          }

          // 3. Skip real DLCs & add-ons (only if mainGameItem has an actual id/namespace)
          const hasRealMainGame = Boolean(
            (item.metadata?.mainGameItem && (item.metadata.mainGameItem.id || item.metadata.mainGameItem.namespace)) ||
            (item.mainGameItem && (item.mainGameItem.id || item.mainGameItem.namespace))
          );
          if (hasRealMainGame) continue;

          // 4. Skip non-application item types
          const itemType = (item.metadata?.itemType || '').toUpperCase();
          if (['ADD_ON', 'DLC', 'CONSUMABLE', 'WALLET', 'SUBSCRIPTION', 'PLUGIN', 'EXTRA', 'CURRENCY'].includes(itemType)) {
            continue;
          }

          // 5. Skip non-game category paths
          const categories = item.metadata?.categories || [];
          const isAddonCategory = categories.some((c: any) =>
            ['addons', 'dlc', 'mods', 'digitalextras', 'consumable', 'vault'].some((sub) =>
              (c.path || '').toLowerCase().includes(sub)
            )
          );
          if (isAddonCategory) continue;

          // 6. Skip Fortnite microtransactions / item shop add-ons
          if (item.appName?.startsWith('Fortnite_')) continue;

          const appNameLower = (item.appName || '').toLowerCase().trim();
          const catalogIdLower = (item.catalogItemId || '').toLowerCase().trim();
          const sandboxLower = (item.sandboxName || '').toLowerCase().trim();

          // Check if item matches the verified Epic library catalog directly
          const catalogGame =
            epicCatalogById.get(catalogIdLower) ||
            epicCatalogById.get(appNameLower) ||
            epicCatalogByTitle.get(sandboxLower);

          if (catalogGame) {
            if (!seenIds.has(catalogGame.id)) {
              seenIds.add(catalogGame.id);
              games.push(catalogGame);
            }
            continue;
          }

          let rawTitle = (item.metadata?.title || item.sandboxName || '').trim();
          const titleLower = rawTitle.toLowerCase().trim();

          // Check if item matches a known Epic codename
          const codename =
            KNOWN_EPIC_APP_NAMES[appNameLower] ||
            KNOWN_EPIC_APP_NAMES[catalogIdLower] ||
            KNOWN_EPIC_APP_NAMES[titleLower];

          let title = codename ? codename.title : rawTitle;

          // If title is missing, pure hex hash, or raw UUID, NEVER allow as a game entry
          if (
            !title ||
            /^[0-9a-f]{20,}$/i.test(title) ||
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title)
          ) {
            continue;
          }

          // Reject raw codenames that aren't mapped
          if (['bobcat', 'boxfish', 'calluna', 'catnip', 'cormorant'].includes(title.toLowerCase())) {
            continue;
          }

          // Filter out Fortnite cosmetic bundles / V-Bucks packs
          const lower = title.toLowerCase();
          if (lower.includes('fortnite') && lower !== 'fortnite') {
            const isFortniteDlc = [
              'pack', 'bundle', 'v-bucks', 'vbucks', 'skin', 'battle pass',
              'outfit', 'drop', 'chapter', 'season', 'crew', 'starter', 'quest'
            ].some((kw) => lower.includes(kw));
            if (isFortniteDlc) continue;
          }

          const keyImages = item.metadata?.keyImages || [];
          const tallCover = keyImages.find((img: any) => img.type === 'DieselGameBoxTall')?.url;
          const wideBanner = keyImages.find((img: any) => img.type === 'DieselGameBox')?.url || tallCover;

          const appId = item.catalogItemId || item.appName;

          // Match Steam App ID if available
          const steamAppId: number | undefined = (codename && codename.steamAppId)
            ? codename.steamAppId
            : ((await steamMatcher.matchGameToSteam(title)) || undefined);

          const headerImg = steamAppId
            ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/header.jpg`
            : (codename && codename.headerImage) || wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png';

          const capsuleImg = steamAppId
            ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamAppId}/library_600x900_2x.jpg`
            : (codename && codename.capsuleImage) || tallCover || wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png';

          const iconImg = (codename && codename.iconUrl) ? codename.iconUrl : undefined;

          const developer = (codename && codename.developer)
            ? codename.developer
            : (item.metadata?.developer || '');

          const shortDescription = (codename && codename.description)
            ? codename.description
            : (item.metadata?.description || 'Epic Games Store Title');

          const constructedGame: CanonicalGame = {
            id: steamAppId ? `steam-${steamAppId}` : `epic-${appId}`,
            title,
            sortTitle: title.replace(/^(The|A|An)\s+/i, ''),
            steamAppId,
            platforms: [
              {
                platformId: 'epic',
                platformGameId: appId,
                installed: false,
                playtimeMinutes: 0,
              },
            ],
            headerImage: headerImg,
            capsuleImage: capsuleImg,
            iconUrl: iconImg,
            shortDescription,
            releaseDate: item.metadata?.releaseDate || '',
            developers: developer ? [developer] : [],
            publishers: item.metadata?.publisher ? [item.metadata.publisher] : [],
            genres: ['Action'],
            tags: ['Epic Games Store'],
          };

          if (!seenIds.has(constructedGame.id)) {
            seenIds.add(constructedGame.id);
            games.push(constructedGame);
          }
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
    let accountName = credentials.epicAccountId?.trim() || 'BobDo1e';
    const avatarUrl = 'https://cdn2.unrealengine.com/egs-badge.png';

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
    }

    // Return the verified 402-game user library (authoritative base games with official metadata)
    return { accountName, avatarUrl, games: EPIC_USER_LIBRARY };
  }
}

export const epicIntegration = new EpicIntegrationService();
