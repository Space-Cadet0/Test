import { StorefrontId } from '../../contracts/platform';
import { StorefrontIntegration, StorefrontCredentials } from '../../contracts/integration';
import { CanonicalGame } from '../../contracts/game';
import { FULL_USER_STEAM_GAMES } from '../storage/fullUserSteamGames';
import { steamIntegration } from './steamIntegration';

const STORAGE_KEY_INTEGRATIONS = 'antigravity_storefront_integrations';
const STORAGE_KEY_CUSTOM_GAMES = 'antigravity_synced_user_games';

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

export function loadCustomSyncedGames(): CanonicalGame[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_GAMES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomSyncedGames(games: CanonicalGame[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_GAMES, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save custom synced games', err);
  }
}

/**
 * Connect a Steam account via Web API / ID / Profile URL without requiring any installed Steam client
 */
export async function connectSteamIntegration(
  credentials: StorefrontCredentials
): Promise<{ integration: StorefrontIntegration; games: CanonicalGame[] }> {
  const { profile, games } = await steamIntegration.fetchOwnedGames(credentials);

  const integration: StorefrontIntegration = {
    storefrontId: 'steam',
    name: 'Steam',
    isConnected: true,
    accountName: profile.personaName,
    accountId: profile.steamId,
    avatarUrl: profile.avatarUrl,
    gamesCount: games.length,
    lastSyncedAt: new Date().toISOString(),
    authMethod: credentials.apiKey ? 'web_api' : 'public_profile',
    credentials,
    statusMessage: `Connected as ${profile.personaName} (${games.length} games synced)`,
  };

  const integrations = loadIntegrations().map((i) =>
    i.storefrontId === 'steam' ? integration : i
  );
  saveIntegrations(integrations);
  saveCustomSyncedGames(games);

  return { integration, games };
}

/**
 * Disconnect an integration
 */
export function disconnectIntegration(storefrontId: StorefrontId): StorefrontIntegration[] {
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

  saveIntegrations(integrations);
  return integrations;
}
