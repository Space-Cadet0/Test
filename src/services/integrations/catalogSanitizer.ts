import { CanonicalGame } from '../../contracts/game';

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
    // If it's specifically Doki Doki Literature Club Plus! (Epic App ID c5109bdceb3a453bb38c2fdc964ddee8)
    // we don't drop it, we rename it in sanitizeCatalog.
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
 * 1. Renames known hex app IDs to their official game titles (e.g. c5109bdceb3a453bb38c2fdc964ddee8 -> Doki Doki Literature Club Plus!)
 * 2. Purges raw GUIDs, Fortnite microtransaction items, and invalid DLC entries.
 */
export function sanitizeGameCatalog(catalog: CanonicalGame[]): CanonicalGame[] {
  if (!Array.isArray(catalog)) return [];

  const cleaned: CanonicalGame[] = [];
  const seenSlugs = new Set<string>();

  for (const game of catalog) {
    if (!game || !game.title) continue;

    // Resolve Doki Doki Literature Club Plus! if it has the raw Epic app ID
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
          p.platformId === 'epic'
            ? { ...p, platformGameId: 'c5109bdceb3a453bb38c2fdc964ddee8' }
            : p
        ),
      };
      if (!seenSlugs.has(fixedGame.title.toLowerCase())) {
        seenSlugs.add(fixedGame.title.toLowerCase());
        cleaned.push(fixedGame);
      }
      continue;
    }

    // Filter out junk
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
