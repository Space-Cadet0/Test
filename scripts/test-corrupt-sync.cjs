const fs = require('fs');

// Helper to load TS exports by parsing JSON data
function loadExportedArray(filePath, exportName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const start = content.indexOf(`export const ${exportName}: CanonicalGame[] = [\n`) + `export const ${exportName}: CanonicalGame[] = `.length;
  const end = content.lastIndexOf('];') + 1;
  const jsonStr = content.substring(start, end);
  return eval('(' + jsonStr + ')');
}

const gogGames = loadExportedArray('./src/services/storage/gogUserLibrary.ts', 'GOG_USER_LIBRARY');
const epicGames = loadExportedArray('./src/services/storage/epicUserLibrary.ts', 'EPIC_USER_LIBRARY');
const steamGames = loadExportedArray('./src/services/storage/fullUserSteamGames.ts', 'FULL_USER_STEAM_GAMES');
const rawRecords = JSON.parse(fs.readFileSync('./scripts/epic_raw_records.json', 'utf-8'));

// Load codenames mappings from epicCodenames.ts
const codenamesContent = fs.readFileSync('./src/services/integrations/epicCodenames.ts', 'utf-8');
const codenamesStart = codenamesContent.indexOf('KNOWN_EPIC_APP_NAMES: Record<string, EpicCodenameMapping> = ') + 'KNOWN_EPIC_APP_NAMES: Record<string, EpicCodenameMapping> = '.length;
const codenamesEnd = codenamesContent.lastIndexOf(';');
const KNOWN_EPIC_APP_NAMES = JSON.parse(codenamesContent.substring(codenamesStart, codenamesEnd));

function normalizeCanonicalTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2')
    .replace(/\biv\b/g, '4')
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+(complete|definitive|enhanced|game of the year|goty|remastered|deluxe|gold|standard)\s+edition/g, '')
    .replace(/\s+edition$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const validGogProductIds = new Set();
const validGogTitles = new Set();
for (const g of gogGames) {
  validGogTitles.add(normalizeCanonicalTitle(g.title));
  for (const p of g.platforms) {
    if (p.platformId === 'gog' && p.platformGameId) {
      validGogProductIds.add(p.platformGameId.trim());
    }
  }
}

const validEpicBaseGameByCatalogId = new Map();
const validEpicCatalogIds = new Set();
const validEpicTitles = new Set();
const validEpicSteamAppIds = new Set();
for (const g of epicGames) {
  validEpicTitles.add(normalizeCanonicalTitle(g.title));
  if (g.steamAppId) validEpicSteamAppIds.add(g.steamAppId);
  for (const p of g.platforms) {
    if (p.platformId === 'epic' && p.platformGameId) {
      const cleanId = p.platformGameId.trim().toLowerCase();
      validEpicCatalogIds.add(cleanId);
      validEpicBaseGameByCatalogId.set(cleanId, g);
    }
  }
}

function sanitizeGameCatalog(catalog) {
  if (!Array.isArray(catalog)) return [];
  const cleaned = [];
  const titleToIndex = new Map();
  const steamIdToIndex = new Map();

  for (const rawGame of catalog) {
    if (!rawGame || !rawGame.title) continue;
    let game = { ...rawGame };
    const lowerTitle = game.title.toLowerCase().trim();
    const hasEpicPlatform = game.platforms.some(p => p.platformId === 'epic');

    // 1. Boga match
    if (hasEpicPlatform && (lowerTitle === 'boga' || lowerTitle === 'path of the bogatyr')) {
      game = {
        ...game,
        id: 'steam-1190460',
        title: 'Death Stranding',
        sortTitle: 'Death Stranding',
        steamAppId: 1190460,
      };
    }

    // 2. Epic codename mapping
    const epicPlatform = game.platforms.find(p => p.platformId === 'epic');
    const epicPlatformId = (epicPlatform?.platformGameId || '').toLowerCase().trim();
    const gameIdClean = game.id.replace(/^epic-/, '').toLowerCase().trim();
    const epicMapping = KNOWN_EPIC_APP_NAMES[lowerTitle] || (epicPlatformId ? KNOWN_EPIC_APP_NAMES[epicPlatformId] : undefined) || (gameIdClean ? KNOWN_EPIC_APP_NAMES[gameIdClean] : undefined);
    if (epicMapping) {
      const steamId = epicMapping.steamAppId;
      game = {
        ...game,
        id: steamId ? `steam-${steamId}` : game.id,
        title: epicMapping.title,
        sortTitle: epicMapping.title.replace(/^(The|A|An)\s+/i, ''),
        steamAppId: steamId || game.steamAppId,
      };
    }

    const currentTitleLower = game.title.toLowerCase().trim();
    let normTitle = normalizeCanonicalTitle(game.title);

    // Disambiguate Blood Omen: Legacy of Kain (1996 original) from Blood Omen 2
    if (
      (normTitle === 'blood omen legacy of kain' || currentTitleLower.includes('blood omen')) &&
      !currentTitleLower.includes('2') &&
      !currentTitleLower.includes('ii') &&
      game.steamAppId === 242960
    ) {
      game = {
        ...game,
        id: 'gog-1837805079',
        steamAppId: undefined,
        platforms: game.platforms.map(p => p.platformId === 'gog' ? { ...p, platformGameId: '1837805079' } : p),
      };
    }

    // Disambiguate DOOM + DOOM II (not on Steam)
    if (
      currentTitleLower === 'doom + doom ii' ||
      currentTitleLower === 'doom + doom 2' ||
      normTitle === 'doom + doom 2' ||
      normTitle === 'doom doom 2'
    ) {
      game = {
        ...game,
        id: 'gog-1413291984',
        steamAppId: undefined,
        platforms: game.platforms.map(p => p.platformId === 'gog' ? { ...p, platformGameId: '1413291984' } : p),
      };
    }

    // 5. Remove erroneous epic
    if (currentTitleLower.includes('gwent') || currentTitleLower.includes('heroes of might and magic')) {
      game = {
        ...game,
        platforms: game.platforms.filter(p => p.platformId !== 'epic'),
      };
      if (game.platforms.length === 0) continue;
    }

    // 6. GOG platform ownership validation
    if (game.platforms.some(p => p.platformId === 'gog')) {
      const gogPlat = game.platforms.find(p => p.platformId === 'gog');
      const isRealGogGame = (gogPlat?.platformGameId && validGogProductIds.has(gogPlat.platformGameId.trim())) || validGogTitles.has(normTitle);
      if (!isRealGogGame) {
        game = {
          ...game,
          platforms: game.platforms.filter(p => p.platformId !== 'gog'),
        };
        if (game.platforms.length === 0) continue;
      }
    }

    // 7. Epic platform ownership validation
    if (game.platforms.some(p => p.platformId === 'epic')) {
      const epicPlat = game.platforms.find(p => p.platformId === 'epic');
      const epicGameId = (epicPlat?.platformGameId || '').trim().toLowerCase();

      // If title is not recognized, but catalog ID matches a verified base game, re-assign to real base game
      if (!validEpicTitles.has(normTitle) && validEpicBaseGameByCatalogId.has(epicGameId)) {
        const baseGame = validEpicBaseGameByCatalogId.get(epicGameId);
        game = {
          ...baseGame,
          platforms: game.platforms.map(p => p.platformId === 'epic' ? { ...p, platformGameId: epicGameId } : p),
        };
      }

      const updatedNormTitle = normalizeCanonicalTitle(game.title);
      const isRealEpicGame = validEpicTitles.has(updatedNormTitle);

      if (!isRealEpicGame) {
        game = {
          ...game,
          platforms: game.platforms.filter(p => p.platformId !== 'epic'),
        };
        if (game.platforms.length === 0) continue;
      }
    }

    normTitle = normalizeCanonicalTitle(game.title);

    // 8. Deduplication
    const existingIndex =
      (game.steamAppId && steamIdToIndex.has(game.steamAppId) ? steamIdToIndex.get(game.steamAppId) : undefined) ??
      (normTitle && titleToIndex.has(normTitle) ? titleToIndex.get(normTitle) : undefined);

    if (existingIndex !== undefined && cleaned[existingIndex]) {
      const existing = cleaned[existingIndex];
      const mergedPlatforms = [...existing.platforms];
      for (const p of game.platforms) {
        if (!mergedPlatforms.some(ep => ep.platformId === p.platformId)) {
          mergedPlatforms.push(p);
        }
      }
      cleaned[existingIndex] = {
        ...existing,
        steamAppId: existing.steamAppId || game.steamAppId,
        platforms: mergedPlatforms,
      };
    } else {
      const newIndex = cleaned.length;
      cleaned.push(game);
      if (normTitle) titleToIndex.set(normTitle, newIndex);
      if (game.steamAppId) steamIdToIndex.set(game.steamAppId, newIndex);
    }
  }

  return cleaned.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

function mergeStorefrontGames(currentCatalog, newGames, storefrontId) {
  const sanitizedNew = sanitizeGameCatalog(newGames);
  const merged = [...currentCatalog];

  for (const newGame of sanitizedNew) {
    const newNorm = normalizeCanonicalTitle(newGame.title);
    const existingIndex = merged.findIndex(
      (g) =>
        (g.steamAppId && newGame.steamAppId && g.steamAppId === newGame.steamAppId) ||
        g.title.toLowerCase().trim() === newGame.title.toLowerCase().trim() ||
        (newNorm && normalizeCanonicalTitle(g.title) === newNorm)
    );

    const platformOwnership = newGame.platforms.find((p) => p.platformId === storefrontId) || {
      platformId: storefrontId,
      platformGameId: newGame.id,
      installed: false,
    };

    if (existingIndex >= 0) {
      const existing = merged[existingIndex];
      const hasPlatform = existing.platforms.some((p) => p.platformId === storefrontId);
      const updatedPlatforms = hasPlatform
        ? existing.platforms
        : [...existing.platforms, platformOwnership];

      merged[existingIndex] = {
        ...existing,
        steamAppId: existing.steamAppId || newGame.steamAppId,
        id: existing.steamAppId
          ? `steam-${existing.steamAppId}`
          : newGame.steamAppId
          ? `steam-${newGame.steamAppId}`
          : existing.id,
        platforms: updatedPlatforms,
      };
    } else {
      merged.push({
        ...newGame,
        platforms: [platformOwnership],
      });
    }
  }

  const finalCatalog = sanitizeGameCatalog(merged);
  return finalCatalog.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
}

// SIMULATE CORRUPT LOCALSTORAGE STATE
console.log('--- SIMULATING APP WITH CORRUPT LOCALSTORAGE (475 RAW RECORDS + FALSE MATCHES) ---');
const corruptCachedGames = [
  ...steamGames,
  ...gogGames.map(g => g.title === 'Blood Omen: Legacy of Kain' ? { ...g, steamAppId: 242960 } : g),
  ...rawRecords.map(r => ({
    id: 'epic-' + (r.catalogItemId || r.appName),
    title: (r.metadata?.title || r.sandboxName || '').trim(),
    platforms: [{ platformId: 'epic', platformGameId: r.catalogItemId || r.appName }]
  }))
];

console.log(`Corrupt input catalog size: ${corruptCachedGames.length}`);

// Step 1: Clean startup sanitization in App.tsx
let sanitized = sanitizeGameCatalog(corruptCachedGames);

const gogCount = sanitized.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
if (gogCount !== gogGames.length) {
  sanitized = sanitizeGameCatalog(mergeStorefrontGames(sanitized, gogGames, 'gog'));
}

const epicCount = sanitized.filter(g => g.platforms.some(p => p.platformId === 'epic')).length;
if (epicCount !== epicGames.length) {
  sanitized = sanitizeGameCatalog(mergeStorefrontGames(sanitized, epicGames, 'epic'));
}

const finalGog = sanitized.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
const finalEpic = sanitized.filter(g => g.platforms.some(p => p.platformId === 'epic')).length;

const epicTitlesInSanitized = new Set(sanitized.filter(g => g.platforms.some(p => p.platformId === 'epic')).map(g => normalizeCanonicalTitle(g.title)));
const missing = epicGames.filter(eg => !epicTitlesInSanitized.has(normalizeCanonicalTitle(eg.title)));
if (missing.length > 0) {
  console.log('Missing from Epic (' + missing.length + '):', missing.map(m => m.title));
}

console.log('\n=== FINAL VERIFICATION RESULTS ===');
console.log(`GOG Count:  ${finalGog}  (Expected: 314) -> ${finalGog === 314 ? 'PASS' : 'FAIL'}`);
console.log(`Epic Count: ${finalEpic} (Expected: 402) -> ${finalEpic === 402 ? 'PASS' : 'FAIL'}`);

// Test codenames
const badNames = [
  'blackcoral', 'blunderbuss', 'boysenberry', 'brilliantrose', 'cadmiumred', 'capsicum',
  'alabaster', 'ark', 'kingletaztec'
];
for (const bad of badNames) {
  const found = sanitized.filter(g => g.title.toLowerCase() === bad || (bad === 'ark' && g.title.toLowerCase() === 'ark'));
  console.log(`Check '${bad}': ${found.length === 0 ? 'CLEAN (0)' : 'FAILED (' + found.length + ')'}`);
}

// Test Blood Omen disambiguation
const bo1 = sanitized.find(g => g.title === 'Blood Omen: Legacy of Kain');
console.log(`Blood Omen: Legacy of Kain steamAppId: ${bo1?.steamAppId === undefined ? 'PASS (undefined)' : 'FAIL (' + bo1?.steamAppId + ')'}`);

// Test DOOM + DOOM II
const doomGame = sanitized.find(g => g.title === 'DOOM + DOOM II');
console.log(`DOOM + DOOM II steamAppId: ${doomGame?.steamAppId === undefined ? 'PASS (undefined)' : 'FAIL (' + doomGame?.steamAppId + ')'}`);

// Step 2: Full sync cycle verification (manual or background sync)
console.log('\n--- VERIFYING MANUAL / BACKGROUND SYNC TRIGGER ---');
let syncCatalog = [...sanitized];
syncCatalog = mergeStorefrontGames(syncCatalog, gogGames, 'gog');
syncCatalog = mergeStorefrontGames(syncCatalog, epicGames, 'epic');
syncCatalog = sanitizeGameCatalog(syncCatalog);
const syncGog = syncCatalog.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
const syncEpic = syncCatalog.filter(g => g.platforms.some(p => p.platformId === 'epic')).length;
console.log(`Sync GOG Count:  ${syncGog}  (Expected: 314) -> ${syncGog === 314 ? 'PASS' : 'FAIL'}`);
console.log(`Sync Epic Count: ${syncEpic} (Expected: 402) -> ${syncEpic === 402 ? 'PASS' : 'FAIL'}`);

