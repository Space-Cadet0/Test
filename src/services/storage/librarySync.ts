import { CanonicalGame } from '../../contracts/game';
import { FULL_USER_STEAM_GAMES } from './fullUserSteamGames';
import { USER_SCANNED_STEAM_GAMES } from './userScannedLibrary';

export function mergeScannedSteamGames(existingGames: CanonicalGame[]): CanonicalGame[] {
  const merged = [...existingGames];

  // Merge full local Steam library of 251 games
  const allSteamGames = [...USER_SCANNED_STEAM_GAMES, ...FULL_USER_STEAM_GAMES];

  for (const scanned of allSteamGames) {
    const existingIndex = merged.findIndex(
      (g) =>
        (g.steamAppId && g.steamAppId === scanned.steamAppId) ||
        g.title.toLowerCase().trim() === scanned.title.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      const existing = merged[existingIndex];
      const hasSteam = existing.platforms.some((p) => p.platformId === 'steam');
      if (!hasSteam) {
        merged[existingIndex] = {
          ...existing,
          steamAppId: existing.steamAppId || scanned.steamAppId,
          platforms: [...existing.platforms, ...scanned.platforms],
        };
      }
    } else {
      merged.push(scanned);
    }
  }

  // Sort alphabetically by canonical title (ignoring leading articles if desired)
  return merged.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}
