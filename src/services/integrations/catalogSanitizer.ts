import { CanonicalGame } from '../../contracts/game';
import { KNOWN_EPIC_APP_NAMES } from './epicCodenames';

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
 * Sanitizes the catalog:
 * 1. Renames known Epic codenames (Boga, Blobfish, Barbet, Basil, Batfish, etc.) to their official game titles and covers
 * 2. Corrects the false match where "Path of the Bogatyr" was assigned to Epic's "Boga" (Death Stranding)
 * 3. Purges raw GUIDs, Fortnite microtransaction items, and invalid DLC entries.
 */
export function sanitizeGameCatalog(catalog: CanonicalGame[]): CanonicalGame[] {
  if (!Array.isArray(catalog)) return [];

  const cleaned: CanonicalGame[] = [];
  const seenSlugs = new Set<string>();

  for (const game of catalog) {
    if (!game || !game.title) continue;

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
      const fixedGame: CanonicalGame = {
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
      if (!seenSlugs.has(fixedGame.title.toLowerCase())) {
        seenSlugs.add(fixedGame.title.toLowerCase());
        cleaned.push(fixedGame);
      }
      continue;
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
      const fixedGame: CanonicalGame = {
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
      if (!seenSlugs.has(fixedGame.title.toLowerCase())) {
        seenSlugs.add(fixedGame.title.toLowerCase());
        cleaned.push(fixedGame);
      }
      continue;
    }

    // 3. Resolve raw Doki Doki Literature Club Plus! if present as hex ID
    if (
      game.id.includes('c5109bdceb3a453bb38c2fdc964ddee8') ||
      game.title === 'c5109bdceb3a453bb38c2fdc964ddee8'
    ) {
      const fixedGame: CanonicalGame = {
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
      if (!seenSlugs.has(fixedGame.title.toLowerCase())) {
        seenSlugs.add(fixedGame.title.toLowerCase());
        cleaned.push(fixedGame);
      }
      continue;
    }

    // 4. Filter out junk & non-games
    if (isEpicNonGameEntry(game)) {
      continue;
    }

    const key = (game.steamAppId ? `steam-${game.steamAppId}` : game.title).toLowerCase().trim();
    if (!seenSlugs.has(key)) {
      seenSlugs.add(key);
      cleaned.push(game);
    }
  }

  return cleaned.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
