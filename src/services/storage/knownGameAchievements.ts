import knownAchievementsRaw from './knownGameAchievements.json';
import { StoreAchievementSummary } from '../../contracts/game';

const SPECIAL_NON_STEAM_ACHIEVEMENTS: Record<string, number> = {
  'alan wake 2': 88,
  'epic-93f2a8c3547846eda966cb3c152a026e': 88,
  'gog-1413291984': 34, // DOOM + DOOM II
  'doom + doom ii': 34,
};

export const KNOWN_USER_EPIC_ACHIEVEMENTS: Record<string, StoreAchievementSummary> = {
  'alan wake 2': {
    unlocked: 59,
    total: 88,
    percentage: 67,
    xp: { earned: 830, total: 1360 },
    isMastered: false,
  },
  'epic-93f2a8c3547846eda966cb3c152a026e': {
    unlocked: 59,
    total: 88,
    percentage: 67,
    xp: { earned: 830, total: 1360 },
    isMastered: false,
  },
  'c4763f236d08423eb47b4c3008779c84': {
    unlocked: 59,
    total: 88,
    percentage: 67,
    xp: { earned: 830, total: 1360 },
    isMastered: false,
  },
};

export const KNOWN_GAME_ACHIEVEMENT_TOTALS: Record<string, number> = knownAchievementsRaw as Record<string, number>;

/**
 * Returns the verified total achievements for a game by steamAppId, platform game ID, or canonical title.
 */
export function getKnownAchievementTotal(
  steamAppId?: number,
  gameId?: string,
  title?: string
): number | undefined {
  if (steamAppId && KNOWN_GAME_ACHIEVEMENT_TOTALS[String(steamAppId)] !== undefined) {
    return KNOWN_GAME_ACHIEVEMENT_TOTALS[String(steamAppId)];
  }
  if (gameId && SPECIAL_NON_STEAM_ACHIEVEMENTS[gameId.toLowerCase()] !== undefined) {
    return SPECIAL_NON_STEAM_ACHIEVEMENTS[gameId.toLowerCase()];
  }
  if (title && SPECIAL_NON_STEAM_ACHIEVEMENTS[title.toLowerCase().trim()] !== undefined) {
    return SPECIAL_NON_STEAM_ACHIEVEMENTS[title.toLowerCase().trim()];
  }
  return undefined;
}

/**
 * Returns user Epic achievements from cache or verified records.
 */
export function getKnownEpicAchievements(
  gameId?: string,
  title?: string
): StoreAchievementSummary | undefined {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('antigravity_epic_achievements');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (title && parsed[title.toLowerCase().trim()]) {
          return parsed[title.toLowerCase().trim()];
        }
        const normTitle = title?.toLowerCase().replace(/[:\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
        if (normTitle && parsed[normTitle]) {
          return parsed[normTitle];
        }
        if (gameId && parsed[gameId.toLowerCase()]) {
          return parsed[gameId.toLowerCase()];
        }
      }
    } catch {
      // Ignore cache parse errors
    }
  }

  if (title && KNOWN_USER_EPIC_ACHIEVEMENTS[title.toLowerCase().trim()]) {
    return KNOWN_USER_EPIC_ACHIEVEMENTS[title.toLowerCase().trim()];
  }
  if (gameId && KNOWN_USER_EPIC_ACHIEVEMENTS[gameId.toLowerCase()]) {
    return KNOWN_USER_EPIC_ACHIEVEMENTS[gameId.toLowerCase()];
  }
  return undefined;
}

export function cacheUserEpicAchievements(map: Record<string, StoreAchievementSummary>): void {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem('antigravity_epic_achievements');
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    const merged = { ...existing, ...map };
    localStorage.setItem('antigravity_epic_achievements', JSON.stringify(merged));
  } catch (err) {
    console.warn('Failed to cache Epic achievements to localStorage:', err);
  }
}
