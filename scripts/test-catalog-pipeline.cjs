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

// Load epicCodenames mappings
const codenamesContent = fs.readFileSync('./src/services/integrations/epicCodenames.ts', 'utf-8');
const codenamesStart = codenamesContent.indexOf('KNOWN_EPIC_APP_NAMES: Record<string, EpicCodenameMapping> = {') + 'KNOWN_EPIC_APP_NAMES: Record<string, EpicCodenameMapping> = '.length;
const codenamesEnd = codenamesContent.indexOf('};\n', codenamesStart) + 1;
const KNOWN_EPIC_APP_NAMES = eval('(' + codenamesContent.substring(codenamesStart, codenamesEnd) + ')');

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

const validEpicCatalogIds = new Set();
const validEpicTitles = new Set();
const validEpicSteamAppIds = new Set();
for (const g of epicGames) {
  validEpicTitles.add(normalizeCanonicalTitle(g.title));
  if (g.steamAppId) validEpicSteamAppIds.add(g.steamAppId);
  for (const p of g.platforms) {
    if (p.platformId === 'epic' && p.platformGameId) {
      validEpicCatalogIds.add(p.platformGameId.trim().toLowerCase());
    }
  }
}

function isEpicNonGameEntry(game) {
  const title = (game.title || '').trim().toLowerCase();
  const id = (game.id || '').toLowerCase();
  if (/^[0-9a-f]{20,}$/i.test(game.title)) {
    if (id.includes('c5109bdceb3a453bb38c2fdc964ddee8')) return false;
    return true;
  }
  if (title.includes('fortnite')) {
    const isFortniteDlc = ['pack', 'bundle', 'v-bucks', 'vbucks', 'skin', 'battle pass', 'outfit', 'chapter', 'season', 'starter', 'crew', 'drop', 'quest', 'emotes'].some(kw => title.includes(kw));
    if (isFortniteDlc && title !== 'fortnite') return true;
  }
  if (title.includes('starter content') || title.includes('unreal engine') || title.includes('megascans') || id.includes('ue-') || id.includes('unreal')) return true;
  return false;
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

    // 4. Filter out junk
    if (isEpicNonGameEntry(game)) continue;
    const currentTitleLower = game.title.toLowerCase().trim();
    if ([
      'bobcat', 'boxfish', 'calluna', 'catnip', 'cormorant',
      'hazelnut', 'hazlenut', 'herring', 'boga', 'barbet', 'basil', 'batfish', 'batfishs2', 'blobfish',
      'speedwell', 'wombat'
    ].includes(currentTitleLower)) {
      continue;
    }

    // 5. Remove erroneous epic
    if (currentTitleLower.includes('gwent') || currentTitleLower.includes('heroes of might and magic')) {
      game = {
        ...game,
        platforms: game.platforms.filter(p => p.platformId !== 'epic'),
      };
      if (game.platforms.length === 0) continue;
    }

    const normTitle = normalizeCanonicalTitle(game.title);

    // 6. GOG platform ownership validation
    if (game.platforms.some(p => p.platformId === 'gog')) {
      const gogPlatform = game.platforms.find(p => p.platformId === 'gog');
      const isRealGogGame = (gogPlatform?.platformGameId && validGogProductIds.has(gogPlatform.platformGameId.trim())) || validGogTitles.has(normTitle);
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
      const epicPlatform = game.platforms.find(p => p.platformId === 'epic');
      const epicGameId = (epicPlatform?.platformGameId || '').trim().toLowerCase();
      const isRealEpicGame = (epicGameId && validEpicCatalogIds.has(epicGameId)) || (game.steamAppId && validEpicSteamAppIds.has(game.steamAppId)) || validEpicTitles.has(normTitle);
      if (!isRealEpicGame) {
        game = {
          ...game,
          platforms: game.platforms.filter(p => p.platformId !== 'epic'),
        };
        if (game.platforms.length === 0) continue;
      }
    }

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

// Build default catalog
console.log('--- RUNNING PIPELINE ---');
const afterSteam = sanitizeGameCatalog(steamGames);
console.log(`After Steam: ${afterSteam.length} games`);

const afterGog = mergeStorefrontGames(afterSteam, gogGames, 'gog');
console.log(`After GOG merge: ${afterGog.length} games`);
const gogCount = afterGog.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
console.log(`GOG platform count: ${gogCount}`);

const afterEpic = mergeStorefrontGames(afterGog, epicGames, 'epic');
console.log(`After Epic merge: ${afterEpic.length} games`);
const finalGogCount = afterEpic.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
const finalEpicCount = afterEpic.filter(g => g.platforms.some(p => p.platformId === 'epic')).length;
const finalSteamCount = afterEpic.filter(g => g.platforms.some(p => p.platformId === 'steam')).length;

console.log(`\n=== FINAL FILTER COUNTS ===`);
console.log(`GOG Filter Count:   ${finalGogCount} (Expected: 314) -> ${finalGogCount === 314 ? 'PASS' : 'FAIL'}`);
console.log(`Epic Filter Count:  ${finalEpicCount} (Expected: 402) -> ${finalEpicCount === 402 ? 'PASS' : 'FAIL'}`);
console.log(`Steam Filter Count: ${finalSteamCount}`);
console.log(`Total Unique Games: ${afterEpic.length}`);

// Test injecting corrupt/stale items like Hades on Epic, Hazlenut, Herring, Anno 1404
console.log('\n--- TESTING SANITIZER AGAINST STALE / CORRUPT DATA ---');
const corruptData = [
  ...afterEpic,
  {
    id: 'mock-hades',
    title: 'Hades',
    steamAppId: 1145360,
    platforms: [{ platformId: 'epic', platformGameId: 'epic-hades' }],
  },
  {
    id: 'epic-hazlenut',
    title: 'Hazlenut',
    platforms: [{ platformId: 'epic', platformGameId: 'Hazelnut' }],
  },
  {
    id: 'epic-herring',
    title: 'Herring',
    platforms: [{ platformId: 'epic', platformGameId: 'Herring' }],
  },
  {
    id: 'gog-anno-1404',
    title: 'Anno 1404: Gold Edition',
    platforms: [{ platformId: 'gog', platformGameId: 'unowned-anno' }],
  }
];

const cleanedCorrupt = sanitizeGameCatalog(corruptData);
const corruptGogCount = cleanedCorrupt.filter(g => g.platforms.some(p => p.platformId === 'gog')).length;
const corruptEpicCount = cleanedCorrupt.filter(g => g.platforms.some(p => p.platformId === 'epic')).length;
const hadesEpic = cleanedCorrupt.filter(g => g.title.toLowerCase() === 'hades' && g.platforms.some(p => p.platformId === 'epic')).length;
const hazlenutExists = cleanedCorrupt.filter(g => g.title.toLowerCase() === 'hazlenut').length;
const herringExists = cleanedCorrupt.filter(g => g.title.toLowerCase() === 'herring').length;
const annoGog = cleanedCorrupt.filter(g => g.title.toLowerCase().includes('anno 1404') && g.platforms.some(p => p.platformId === 'gog')).length;

console.log(`Corrupt test - GOG Count: ${corruptGogCount} (Expected: 314) -> ${corruptGogCount === 314 ? 'PASS' : 'FAIL'}`);
console.log(`Corrupt test - Epic Count: ${corruptEpicCount} (Expected: 402) -> ${corruptEpicCount === 402 ? 'PASS' : 'FAIL'}`);
console.log(`Corrupt test - Hades on Epic: ${hadesEpic} (Expected: 0) -> ${hadesEpic === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Corrupt test - Hazlenut title: ${hazlenutExists} (Expected: 0) -> ${hazlenutExists === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Corrupt test - Herring title: ${herringExists} (Expected: 0) -> ${herringExists === 0 ? 'PASS' : 'FAIL'}`);
console.log(`Corrupt test - Anno on GOG: ${annoGog} (Expected: 0) -> ${annoGog === 0 ? 'PASS' : 'FAIL'}`);
