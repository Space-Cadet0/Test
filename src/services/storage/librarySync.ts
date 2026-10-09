import { CanonicalGame } from '../../contracts/game';
import { USER_SCANNED_STEAM_GAMES } from './userScannedLibrary';

export function mergeScannedSteamGames(existingGames: CanonicalGame[]): CanonicalGame[] {
  const merged = [...existingGames];

  for (const scanned of USER_SCANNED_STEAM_GAMES) {
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

  return merged;
}
