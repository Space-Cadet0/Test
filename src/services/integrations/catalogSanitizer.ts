import { CanonicalGame } from '../../contracts/game';
import { KNOWN_EPIC_APP_NAMES } from './epicCodenames';
import { GOG_USER_LIBRARY } from '../storage/gogUserLibrary';

/**
 * Checks if a string is a 20+ hex hash or UUID
 */
export function isHexOrGuidString(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  // 24+ character hexadecimal hash (e.g. c5109bdceb3a453bb38c2fdc964ddee8)
  if (/^[0-9a-f]{20,}$/i.test(trimmed)) return true;
  // Standard UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  return false;
}

/**
 * Detects whether an item is a non-game item (Fortnite microtransactions, DLC packs, add-on assets)
 */
export function isEpicNonGameEntry(game: CanonicalGame): boolean {
  const title = (game.title || '').trim().toLowerCase();
  const id = (game.id || '').toLowerCase();

  // Pure hex or UUID titles
  if (isHexOrGuidString(game.title)) {
    if (id.includes('c5109bdceb3a453bb38c2fdc964ddee8')) {
      return false;
    }
    return true;
  }

  // Fortnite DLC, microtransactions, battle passes, cosmetics
  if (title.includes('fortnite')) {
    const isFortniteDlc =
      title.includes('pack') ||
      title.includes('bundle') ||
      title.includes('v-bucks') ||
      title.includes('vbucks') ||
      title.includes('skin') ||
      title.includes('battle pass') ||
      title.includes('outfit') ||
      title.includes('chapter') ||
      title.includes('season') ||
      title.includes('starter') ||
      title.includes('crew') ||
      title.includes('drop') ||
      title.includes('quest') ||
      title.includes('emotes');

    // Only allow the base game "Fortnite"
    if (isFortniteDlc && title !== 'fortnite') {
      return true;
    }
  }

  // Unreal Engine Marketplace assets & plugins
  if (
    title.includes('starter content') ||
    title.includes('unreal engine') ||
    title.includes('megascans') ||
    id.includes('ue-') ||
    id.includes('unreal')
  ) {
    return true;
  }

  // Standalone DLC tags or descriptions that slipped in as separate games
  const hasDlcOnlyTag = game.tags?.some((t) => t.toLowerCase() === 'dlc' || t.toLowerCase() === 'add-on');
  const isSoundtrackOrArtbook =
    title.endsWith(' soundtrack') ||
    title.endsWith(' ost') ||
    title.endsWith(' artbook') ||
    title.includes(' - soundtrack') ||
    title.includes(' bonus content');

  if (hasDlcOnlyTag && isSoundtrackOrArtbook) {
    return true;
  }

  return false;
}

/**
 * Normalizes title for robust cross-storefront game deduplication
 */
export function normalizeCanonicalTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\biv\b/g, '4')
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+(complete|definitive|enhanced|game of the year|goty|remastered|deluxe|gold|standard)\s+edition/g, '')
    .replace(/\s+edition$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const validGogProductIds = new Set<string>();
const validGogTitles = new Set<string>();
for (const g of GOG_USER_LIBRARY) {
  validGogTitles.add(normalizeCanonicalTitle(g.title));
  for (const p of g.platforms) {
    if (p.platformId === 'gog' && p.platformGameId) {
      validGogProductIds.add(p.platformGameId.trim());
    }
  }
}

/**
 * Sanitizes the catalog:
 * 1. Renames known Epic codenames (Boga, Blobfish, Barbet, Basil, Batfish, etc.) to their official game titles and covers
 * 2. Corrects the false match where "Path of the Bogatyr" was assigned to Epic's "Boga" (Death Stranding)
 * 3. Purges raw GUIDs, Fortnite microtransaction items, invalid DLC entries, and unmapped codenames
 * 4. Deduplicates games by normalized title and Steam App ID, merging multi-storefront ownership cleanly
 */
export function sanitizeGameCatalog(catalog: CanonicalGame[]): CanonicalGame[] {
  if (!Array.isArray(catalog)) return [];

  const cleaned: CanonicalGame[] = [];
  const titleToIndex = new Map<string, number>();
  const steamIdToIndex = new Map<number, number>();

  for (const rawGame of catalog) {
    if (!rawGame || !rawGame.title) continue;

    let game = { ...rawGame };
    const lowerTitle = game.title.toLowerCase().trim();
    const hasEpicPlatform = game.platforms.some((p) => p.platformId === 'epic');

    // 1. Correct false match: "Path of the Bogatyr" matched from Epic codename "Boga"
    const isFalseBogaMatch =
      hasEpicPlatform &&
      (lowerTitle === 'path of the bogatyr' ||
        game.platforms.some(
          (p) =>
            p.platformId === 'epic' &&
            ((p.platformGameId || '').toLowerCase() === 'boga' ||
              p.platformGameId === '761fe09295aa422e8199cebaacf51675')
        ));

    if (isFalseBogaMatch || lowerTitle === 'boga') {
      game = {
        ...game,
        id: 'steam-1190460',
        title: 'Death Stranding',
        sortTitle: 'Death Stranding',
        steamAppId: 1190460,
        headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1190460/header.jpg',
        capsuleImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1190460/library_600x900_2x.jpg',
        shortDescription: 'From legendary game creator Hideo Kojima comes an all-new, genre-defying experience. Sam Bridges must brave a world utterly transformed by the Death Stranding.',
        releaseDate: '14 Jul, 2020',
        developers: ['KOJIMA PRODUCTIONS'],
        publishers: ['505 Games'],
        genres: ['Action', 'Adventure'],
        tags: ['Open World', 'Story Rich', 'Atmospheric', 'Sci-fi', 'Post-apocalyptic'],
        platforms: game.platforms.map((p) =>
          p.platformId === 'epic' ? { ...p, platformGameId: '761fe09295aa422e8199cebaacf51675' } : p
        ),
      };
    }

    // 2. Resolve known Epic codenames to their official game entities
    const epicPlatform = game.platforms.find((p) => p.platformId === 'epic');
    const epicPlatformId = (epicPlatform?.platformGameId || '').toLowerCase().trim();
    const gameIdClean = game.id.replace(/^epic-/, '').toLowerCase().trim();

    const epicMapping =
      KNOWN_EPIC_APP_NAMES[lowerTitle] ||
      (epicPlatformId ? KNOWN_EPIC_APP_NAMES[epicPlatformId] : undefined) ||
      (gameIdClean ? KNOWN_EPIC_APP_NAMES[gameIdClean] : undefined);

    if (epicMapping) {
      const steamId = epicMapping.steamAppId;
      game = {
        ...game,
        id: steamId ? `steam-${steamId}` : game.id,
        title: epicMapping.title,
        sortTitle: epicMapping.title.replace(/^(The|A|An)\s+/i, ''),
        steamAppId: steamId || game.steamAppId,
        headerImage: steamId
          ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamId}/header.jpg`
          : game.headerImage,
        capsuleImage: steamId
          ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${steamId}/library_600x900_2x.jpg`
          : game.capsuleImage,
        shortDescription: epicMapping.description || game.shortDescription,
        developers: epicMapping.developer ? [epicMapping.developer] : game.developers,
      };
    }

    // 3. Resolve raw Doki Doki Literature Club Plus! if present as hex ID
    if (
      game.id.includes('c5109bdceb3a453bb38c2fdc964ddee8') ||
      game.title === 'c5109bdceb3a453bb38c2fdc964ddee8'
    ) {
      game = {
        ...game,
        id: 'steam-1388880',
        title: 'Doki Doki Literature Club Plus!',
        sortTitle: 'Doki Doki Literature Club Plus!',
        steamAppId: 1388880,
        headerImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1388880/header.jpg',
        capsuleImage: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1388880/library_600x900_2x.jpg',
        shortDescription: 'Welcome to a terrifying world of poetry and romance! Write poems for your crush and erase any mistakes along the way to ensure your perfect ending.',
        releaseDate: '30 Jun, 2021',
        developers: ['Team Salvato'],
        publishers: ['Serenity Forge'],
        genres: ['Psychological Horror', 'Visual Novel', 'Anime'],
        tags: ['Psychological Horror', 'Visual Novel', 'Anime', 'Story Rich', 'Singleplayer'],
        platforms: game.platforms.map((p) =>
          p.platformId === 'epic' ? { ...p, platformGameId: 'c5109bdceb3a453bb38c2fdc964ddee8' } : p
        ),
      };
    }

    // 4. Filter out junk, pure hex hashes, Fortnite DLC, and unmapped codenames
    if (isEpicNonGameEntry(game)) {
      continue;
    }

    const currentTitleLower = game.title.toLowerCase().trim();
    if (['bobcat', 'boxfish', 'calluna', 'catnip', 'cormorant'].includes(currentTitleLower)) {
      continue;
    }

    // 5. Remove erroneous 'epic' platform presence from non-Epic titles
    if (currentTitleLower.includes('gwent') || currentTitleLower.includes('heroes of might and magic')) {
      game = {
        ...game,
        platforms: game.platforms.filter((p) => p.platformId !== 'epic'),
      };
      if (game.platforms.length === 0) continue;
    }

    const normTitle = normalizeCanonicalTitle(game.title);

    // 6. Purge false GOG platform presence from unowned GOG titles (e.g. old bestselling catalog items like Anno 1404)
    if (game.platforms.some((p) => p.platformId === 'gog')) {
      const gogPlatform = game.platforms.find((p) => p.platformId === 'gog');
      const isRealGogGame =
        (gogPlatform?.platformGameId && validGogProductIds.has(gogPlatform.platformGameId.trim())) ||
        validGogTitles.has(normTitle);

      if (!isRealGogGame) {
        game = {
          ...game,
          platforms: game.platforms.filter((p) => p.platformId !== 'gog'),
        };
        if (game.platforms.length === 0) continue;
      }
    }

    // 7. Intelligent cross-store deduplication by Steam App ID and Normalized Title
    const existingIndex =
      (game.steamAppId && steamIdToIndex.has(game.steamAppId)
        ? steamIdToIndex.get(game.steamAppId)
        : undefined) ??
      (normTitle && titleToIndex.has(normTitle) ? titleToIndex.get(normTitle) : undefined);

    if (existingIndex !== undefined && cleaned[existingIndex]) {
      // Merge platforms across duplicates
      const existing = cleaned[existingIndex];
      const mergedPlatforms = [...existing.platforms];
      for (const p of game.platforms) {
        const found = mergedPlatforms.some((ep) => ep.platformId === p.platformId);
        if (!found) {
          mergedPlatforms.push(p);
        }
      }

      cleaned[existingIndex] = {
        ...existing,
        steamAppId: existing.steamAppId || game.steamAppId,
        id: existing.steamAppId
          ? `steam-${existing.steamAppId}`
          : game.steamAppId
          ? `steam-${game.steamAppId}`
          : existing.id,
        platforms: mergedPlatforms,
        headerImage: existing.headerImage || game.headerImage,
        capsuleImage: existing.capsuleImage || game.capsuleImage,
        shortDescription: existing.shortDescription || game.shortDescription,
        developers: existing.developers && existing.developers.length > 0 ? existing.developers : game.developers,
        publishers: existing.publishers && existing.publishers.length > 0 ? existing.publishers : game.publishers,
      };

      if (cleaned[existingIndex].steamAppId) {
        steamIdToIndex.set(cleaned[existingIndex].steamAppId!, existingIndex);
      }
    } else {
      const newIndex = cleaned.length;
      cleaned.push(game);
      if (normTitle) titleToIndex.set(normTitle, newIndex);
      if (game.steamAppId) steamIdToIndex.set(game.steamAppId, newIndex);
    }
  }

  return cleaned.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
