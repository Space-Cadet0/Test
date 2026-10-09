import { GameCollection } from '../../contracts/collection';

const STORAGE_KEY = 'antigravity_user_collections';

export const DEFAULT_COLLECTIONS: GameCollection[] = [
  {
    id: 'favorites',
    name: 'Favorites',
    isDefault: true,
    gameIds: [
      'steam-1086940', // Baldur's Gate 3
      'steam-1091500', // Cyberpunk 2077
      'steam-292030',  // The Witcher 3
      'steam-782330',  // DOOM Eternal
    ],
  },
  {
    id: 'currently-playing',
    name: 'Currently Playing',
    isDefault: true,
    gameIds: [
      'steam-228280',  // Baldur's Gate: Enhanced Edition
      'steam-257350',  // Baldur's Gate II: Enhanced Edition
    ],
  },
  {
    id: 'backlog',
    name: 'Backlog',
    isDefault: false,
    gameIds: [
      'steam-1174180', // Red Dead Redemption 2
      'steam-814380',  // Sekiro: Shadows Die Twice
      'steam-374320',  // Dark Souls III
      'steam-1687950', // Persona 5 Royal
      'steam-1190460', // Death Stranding
    ],
  },
  {
    id: 'completed',
    name: 'Completed',
    isDefault: false,
    gameIds: [
      'steam-400',     // Portal
      'steam-620',     // Portal 2
      'steam-220',     // Half-Life 2
    ],
  },
];

const UNOWNED_MOCK_IDS = new Set([
  'gears-of-war-e-day',
  'alan-wake-2',
  'hades-ii',
  'hollow-knight-silksong',
  'dead-space-remake',
  'celeste',
]);

const MIGRATED_IDS: Record<string, string> = {
  'death-stranding': 'steam-1190460',
  'cyberpunk-2077': 'steam-1091500',
  'baldurs-gate-3': 'steam-1086940',
};

function sanitizeCollections(cols: GameCollection[]): GameCollection[] {
  return cols.map((col) => ({
    ...col,
    gameIds: Array.from(
      new Set(
        col.gameIds
          .map((id) => MIGRATED_IDS[id] || id)
          .filter((id) => !UNOWNED_MOCK_IDS.has(id))
      )
    ),
  }));
}

export function loadCollections(): GameCollection[] {
  if (typeof window === 'undefined') return DEFAULT_COLLECTIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCollections(DEFAULT_COLLECTIONS);
      return DEFAULT_COLLECTIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = sanitizeCollections(parsed);
      saveCollections(sanitized);
      return sanitized;
    }
    return DEFAULT_COLLECTIONS;
  } catch {
    return DEFAULT_COLLECTIONS;
  }
}

export function saveCollections(collections: GameCollection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (err) {
    console.error('Failed to save collections to localStorage', err);
  }
}
