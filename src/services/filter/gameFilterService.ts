import { CanonicalGame } from '../../contracts/game';
import { ActiveGameFilter } from '../../contracts/filter';
import steamEnrichedCache from '../storage/steamEnrichedCache.json';

const cache = steamEnrichedCache as Record<string, any>;

/**
 * Evaluates whether a game matches the active user-selected temporary filter.
 */
export function matchesGameFilter(game: CanonicalGame, filter: ActiveGameFilter): boolean {
  if (!filter || !filter.value) return true;
  const target = filter.value.trim().toLowerCase();

  if (filter.type === 'developer') {
    return game.developers.some(
      (d) => d.toLowerCase().includes(target) || target.includes(d.toLowerCase())
    );
  }

  if (filter.type === 'publisher') {
    return game.publishers.some(
      (p) => p.toLowerCase().includes(target) || target.includes(p.toLowerCase())
    );
  }

  if (filter.type === 'genre') {
    const inGenres = game.genres.some(
      (g) => g.toLowerCase() === target || g.toLowerCase().includes(target)
    );
    const inTags = game.tags.some(
      (t) => t.toLowerCase() === target || t.toLowerCase().includes(target)
    );
    return inGenres || inTags;
  }

  if (filter.type === 'tag') {
    return (
      game.tags.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target)) ||
      game.genres.some((g) => g.toLowerCase() === target || g.toLowerCase().includes(target))
    );
  }

  if (filter.type === 'feature') {
    // 1. Direct tag match (e.g. "HDR available", "Single-player", "Steam Achievements")
    if (game.tags.some((t) => t.toLowerCase() === target || t.toLowerCase().includes(target))) {
      return true;
    }

    // 2. Direct metadata categories on the game
    if (
      game.enrichedMetadata?.categories?.some((c) =>
        c.description.toLowerCase().includes(target)
      )
    ) {
      return true;
    }

    // 3. Categories stored in steamEnrichedCache
    if (game.steamAppId) {
      const cached = cache[game.steamAppId.toString()];
      if (
        cached?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes(target)
        )
      ) {
        return true;
      }
    }

    // 4. Feature-specific keyword mappings
    // HDR
    if (target.includes('hdr')) {
      if (game.tags.some((t) => t.toLowerCase().includes('hdr'))) return true;
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('hdr')
        )
      ) {
        return true;
      }
    }

    // Controller Support
    if (target.includes('controller')) {
      if (game.tags.some((t) => t.toLowerCase().includes('controller'))) return true;
      if (game.enrichedMetadata?.controllerSupport) return true;
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('controller')
        )
      ) {
        return true;
      }
    }

    // Co-op
    if (target.includes('co-op') || target.includes('coop')) {
      if (
        game.tags.some(
          (t) => t.toLowerCase().includes('co-op') || t.toLowerCase().includes('coop')
        )
      ) {
        return true;
      }
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('co-op')
        )
      ) {
        return true;
      }
    }

    // Multiplayer / PvP
    if (
      target.includes('multiplayer') ||
      target.includes('pvp') ||
      target.includes('multi-player')
    ) {
      if (
        game.tags.some(
          (t) =>
            t.toLowerCase().includes('multiplayer') ||
            t.toLowerCase().includes('pvp') ||
            t.toLowerCase().includes('multi-player')
        )
      ) {
        return true;
      }
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) => {
          const desc = c.description?.toLowerCase() || '';
          return (
            desc.includes('multiplayer') ||
            desc.includes('multi-player') ||
            desc.includes('pvp')
          );
        })
      ) {
        return true;
      }
    }

    // Cloud Sync
    if (target.includes('cloud')) {
      if (game.tags.some((t) => t.toLowerCase().includes('cloud'))) return true;
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('cloud')
        )
      ) {
        return true;
      }
    }

    // Achievements
    if (target.includes('achievement')) {
      if (game.tags.some((t) => t.toLowerCase().includes('achievement'))) return true;
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('achievement')
        )
      ) {
        return true;
      }
    }

    // Family Sharing
    if (target.includes('family')) {
      if (game.tags.some((t) => t.toLowerCase().includes('family'))) return true;
      if (
        game.steamAppId &&
        cache[game.steamAppId.toString()]?.categories?.some((c: any) =>
          c.description?.toLowerCase().includes('family')
        )
      ) {
        return true;
      }
    }

    return false;
  }

  return false;
}
