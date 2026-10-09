import { StorefrontId } from '../../contracts/platform';
import { StorefrontIntegration, StorefrontCredentials } from '../../contracts/integration';
import { CanonicalGame } from '../../contracts/game';
import { FULL_USER_STEAM_GAMES } from '../storage/fullUserSteamGames';
import { steamIntegration } from './steamIntegration';
import { gogIntegration } from './gogIntegration';
import { epicIntegration } from './epicIntegration';
import { xboxIntegration } from './xboxIntegration';
import { mergeScannedSteamGames } from '../storage/librarySync';

const STORAGE_KEY_INTEGRATIONS = 'antigravity_storefront_integrations';
const STORAGE_KEY_CUSTOM_GAMES = 'antigravity_synced_user_games';
const STORAGE_KEY_MAIN_CATALOG = 'universal_game_library_catalog';

export const DEFAULT_INTEGRATIONS: StorefrontIntegration[] = [
  {
    storefrontId: 'steam',
    name: 'Steam',
    isConnected: true,
    accountName: 'SpaceCadet',
    accountId: '76561198244849198',
    avatarUrl: 'https://avatars.steamstatic.com/b5497914488b0a9c8b74681ca039b2cfcfdf6a94_full.jpg',
    gamesCount: FULL_USER_STEAM_GAMES.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: 'web_api',
    credentials: {
      steamId: '76561198244849198',
    },
    statusMessage: 'Connected via Steam Cloud Web Sync (No local client required)',
  },
  {
    storefrontId: 'gog',
    name: 'GOG.com',
    isConnected: false,
    gamesCount: 0,
    statusMessage: 'Ready to connect via GOG account or public profile',
  },
  {
    storefrontId: 'epic',
    name: 'Epic Games Store',
    isConnected: false,
    gamesCount: 0,
    statusMessage: 'Ready to connect via Epic Games account',
  },
  {
    storefrontId: 'xbox',
    name: 'Xbox',
    isConnected: false,
    gamesCount: 0,
    statusMessage: 'Ready to connect via Microsoft / Xbox Live account',
  },
];

export function loadIntegrations(): StorefrontIntegration[] {
  if (typeof window === 'undefined') return DEFAULT_INTEGRATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INTEGRATIONS);
    if (!raw) {
      saveIntegrations(DEFAULT_INTEGRATIONS);
      return DEFAULT_INTEGRATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_INTEGRATIONS;
  } catch {
    return DEFAULT_INTEGRATIONS;
  }
}

export function saveIntegrations(integrations: StorefrontIntegration[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(integrations));
  } catch (err) {
    console.error('Failed to save storefront integrations to localStorage', err);
  }
}

export function loadCurrentCatalog(): CanonicalGame[] {
  if (typeof window === 'undefined') return mergeScannedSteamGames([]);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAIN_CATALOG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore read errors
  }
  return mergeScannedSteamGames([]);
}

export function saveCurrentCatalog(games: CanonicalGame[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MAIN_CATALOG, JSON.stringify(games));
    localStorage.setItem(STORAGE_KEY_CUSTOM_GAMES, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save universal catalog', err);
  }
}

export function mergeStorefrontGames(
  currentCatalog: CanonicalGame[],
  newGames: CanonicalGame[],
  storefrontId: StorefrontId
): CanonicalGame[] {
  const merged = [...currentCatalog];

  for (const newGame of newGames) {
    const existingIndex = merged.findIndex(
      (g) =>
        (g.steamAppId && newGame.steamAppId && g.steamAppId === newGame.steamAppId) ||
        g.title.toLowerCase().trim() === newGame.title.toLowerCase().trim()
    );

    const platformOwnership = newGame.platforms.find((p) => p.platformId === storefrontId) || {
      platformId: storefrontId,
      platformGameId: newGame.id,
      installed: false,
    };

    if (existingIndex >= 0) {
      const existing = merged[existingIndex];
      const hasPlatform = existing.platforms.some((p) => p.platformId === storefrontId);
      if (!hasPlatform) {
        merged[existingIndex] = {
          ...existing,
          platforms: [...existing.platforms, platformOwnership],
        };
      }
    } else {
      merged.push({
        ...newGame,
        platforms: [platformOwnership],
      });
    }
  }

  return merged.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

export function removeStorefrontGames(
  currentCatalog: CanonicalGame[],
  storefrontId: StorefrontId
): CanonicalGame[] {
  const remaining: CanonicalGame[] = [];

  for (const game of currentCatalog) {
    const updatedPlatforms = game.platforms.filter((p) => p.platformId !== storefrontId);
    if (updatedPlatforms.length > 0) {
      remaining.push({
        ...game,
        platforms: updatedPlatforms,
      });
    }
  }

  return remaining.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

/**
 * Connect Steam account via Web API / ID / Profile URL without requiring any installed Steam client
 */
export async function connectSteamIntegration(
  credentials: StorefrontCredentials
): Promise<{ integration: StorefrontIntegration; games: CanonicalGame[] }> {
  const { profile, games: steamGames } = await steamIntegration.fetchOwnedGames(credentials);

  const integration: StorefrontIntegration = {
    storefrontId: 'steam',
    name: 'Steam',
    isConnected: true,
    accountName: profile.personaName,
    accountId: profile.steamId,
    avatarUrl: profile.avatarUrl,
    gamesCount: steamGames.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: credentials.apiKey ? 'web_api' : 'public_profile',
    credentials,
    statusMessage: `Connected as ${profile.personaName} (${steamGames.length} games synced)`,
  };

  const current = loadCurrentCatalog();
  const merged = mergeStorefrontGames(current, steamGames, 'steam');

  const integrations = loadIntegrations().map((i) =>
    i.storefrontId === 'steam' ? integration : i
  );
  saveIntegrations(integrations);
  saveCurrentCatalog(merged);

  return { integration, games: merged };
}

/**
 * Connect GOG account via OAuth / Token / Username
 */
export async function connectGogIntegration(
  credentials: StorefrontCredentials
): Promise<{ integration: StorefrontIntegration; games: CanonicalGame[] }> {
  const { accountName, avatarUrl, games: gogGames } = await gogIntegration.connectAccount(credentials);

  const integration: StorefrontIntegration = {
    storefrontId: 'gog',
    name: 'GOG.com',
    isConnected: true,
    accountName,
    avatarUrl,
    gamesCount: gogGames.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: credentials.gogToken ? 'oauth' : 'public_profile',
    credentials,
    statusMessage: `Connected as ${accountName} (${gogGames.length} GOG titles synced)`,
  };

  const current = loadCurrentCatalog();
  const merged = mergeStorefrontGames(current, gogGames, 'gog');

  const integrations = loadIntegrations().map((i) =>
    i.storefrontId === 'gog' ? integration : i
  );
  saveIntegrations(integrations);
  saveCurrentCatalog(merged);

  return { integration, games: merged };
}

/**
 * Connect Epic Games Store account
 */
export async function connectEpicIntegration(
  credentials: StorefrontCredentials
): Promise<{ integration: StorefrontIntegration; games: CanonicalGame[] }> {
  const { accountName, avatarUrl, games: epicGames } = await epicIntegration.connectAccount(credentials);

  const integration: StorefrontIntegration = {
    storefrontId: 'epic',
    name: 'Epic Games Store',
    isConnected: true,
    accountName,
    avatarUrl,
    gamesCount: epicGames.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: credentials.epicToken ? 'oauth' : 'public_profile',
    credentials,
    statusMessage: `Connected as ${accountName} (${epicGames.length} Epic titles synced)`,
  };

  const current = loadCurrentCatalog();
  const merged = mergeStorefrontGames(current, epicGames, 'epic');

  const integrations = loadIntegrations().map((i) =>
    i.storefrontId === 'epic' ? integration : i
  );
  saveIntegrations(integrations);
  saveCurrentCatalog(merged);

  return { integration, games: merged };
}

/**
 * Connect Xbox / Microsoft Store account
 */
export async function connectXboxIntegration(
  credentials: StorefrontCredentials
): Promise<{ integration: StorefrontIntegration; games: CanonicalGame[] }> {
  const { accountName, avatarUrl, games: xboxGames } = await xboxIntegration.connectAccount(credentials);

  const integration: StorefrontIntegration = {
    storefrontId: 'xbox',
    name: 'Xbox',
    isConnected: true,
    accountName,
    avatarUrl,
    gamesCount: xboxGames.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: 'web_api',
    credentials,
    statusMessage: `Connected as ${accountName} (${xboxGames.length} Xbox titles synced)`,
  };

  const current = loadCurrentCatalog();
  const merged = mergeStorefrontGames(current, xboxGames, 'xbox');

  const integrations = loadIntegrations().map((i) =>
    i.storefrontId === 'xbox' ? integration : i
  );
  saveIntegrations(integrations);
  saveCurrentCatalog(merged);

  return { integration, games: merged };
}

/**
 * Disconnect an integration and remove its platform presence from the library
 */
export function disconnectIntegration(
  storefrontId: StorefrontId
): { integrations: StorefrontIntegration[]; games: CanonicalGame[] } {
  const integrations = loadIntegrations().map((i) => {
    if (i.storefrontId === storefrontId) {
      return {
        ...i,
        isConnected: false,
        accountName: undefined,
        accountId: undefined,
        avatarUrl: undefined,
        gamesCount: 0,
        lastSyncedAt: undefined,
        credentials: undefined,
        statusMessage: 'Disconnected',
      };
    }
    return i;
  });

  const current = loadCurrentCatalog();
  const updatedGames = removeStorefrontGames(current, storefrontId);

  saveIntegrations(integrations);
  saveCurrentCatalog(updatedGames);

  return { integrations, games: updatedGames };
}
