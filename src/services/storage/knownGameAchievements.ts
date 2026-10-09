import knownAchievementsRaw from './knownGameAchievements.json';

const SPECIAL_NON_STEAM_ACHIEVEMENTS: Record<string, number> = {
  'alan wake 2': 88,
  'epic-93f2a8c3547846eda966cb3c152a026e': 88,
  'gog-1413291984': 34, // DOOM + DOOM II
  'doom + doom ii': 34,
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
