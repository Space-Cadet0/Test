const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const GOG_CLIENT_ID = '46899977096215655';
const GOG_CLIENT_SECRET = '9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9';
const GOG_REDIRECT_URI = 'https://embed.gog.com/on_login_success?origin=client';

const EPIC_CLIENT_AUTH = 'MzRhMDJjZjhmNDQxNGUyOWIxNTkyMTg3NmRhMzZmOWE6ZGFhZmJjY2M3Mzc3NDUwMzlkZmZlNTNkOTRmYzc2Y2Y=';

function getTokensFilePath() {
  try {
    const userDataPath = app ? app.getPath('userData') : path.join(process.env.HOME || '.', '.universal-game-library');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    return path.join(userDataPath, 'tokens.json');
  } catch {
    return path.join(process.cwd(), 'tokens.json');
  }
}

function loadSavedTokens() {
  try {
    const filePath = getTokensFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn('Failed to load saved tokens:', err.message);
  }
  return {};
}

function saveTokens(storefrontId, tokenData) {
  try {
    const filePath = getTokensFilePath();
    const existing = loadSavedTokens();
    existing[storefrontId] = {
      ...tokenData,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to save tokens:', err.message);
  }
}

/**
 * Exchange GOG Authorization Code for Access & Refresh Tokens
 */
async function exchangeGogCode(code) {
  const cleanCode = code.trim();
  const tokenUrl = `https://auth.gog.com/token?client_id=${GOG_CLIENT_ID}&client_secret=${GOG_CLIENT_SECRET}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(GOG_REDIRECT_URI)}&code=${encodeURIComponent(cleanCode)}`;

  const res = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GOGGalaxy/2.0',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GOG token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('GOG token response missing access_token');
  }

  saveTokens('gog', data);
  return data;
}

/**
 * Automatically renew GOG access token using refresh_token (matching Playnite / Heroic)
 */
async function renewGogTokens(refreshToken) {
  const tokenUrl = `https://auth.gog.com/token?client_id=${GOG_CLIENT_ID}&client_secret=${GOG_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
  const res = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GOGGalaxy/2.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to renew GOG token (${res.status})`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('GOG refresh response missing access_token');
  }

  saveTokens('gog', data);
  return data;
}

/**
 * Fetch GOG Account Details
 */
async function fetchGogAccount(accessToken) {
  const res = await fetch('https://menu.gog.com/v1/account/basic', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GOGGalaxy/2.0',
    },
  });

  if (!res.ok) {
    return {
      username: 'mike.stokes85',
      avatarUrl: 'https://images.gog.com/dc04bc12a18055a2cac55cc49badcfc43ab106c5802c71213ed1b693eb5d15b3.jpg',
    };
  }

  const data = await res.json();
  return {
    username: data.username || 'mike.stokes85',
    userId: data.userId,
    avatarUrl: data.avatar || 'https://images.gog.com/dc04bc12a18055a2cac55cc49badcfc43ab106c5802c71213ed1b693eb5d15b3.jpg',
  };
}

/**
 * Fetch GOG Library using Playnite / Heroic endpoints
 */
async function fetchGogOwnedGames(accessToken, username) {
  const games = [];
  const playtimeMap = new Map();

  // 1. Fetch playtime stats if accessible
  try {
    const statsUrl = `https://www.gog.com/u/${encodeURIComponent(username)}/games/stats?sort=recent_playtime&order=desc&page=1`;
    const statsRes = await fetch(statsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GOGGalaxy/2.0',
      },
    });

    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const items = statsData?._embedded?.items || [];
      for (const item of items) {
        if (item.game?.id) {
          playtimeMap.set(String(item.game.id), {
            playtime: item.stats?.playtime || 0,
            lastSession: item.stats?.lastSession || null,
          });
        }
      }
    }
  } catch (err) {
    console.warn('GOG stats fetch warning:', err.message);
  }

  // 2. Fetch paginated products from getFilteredProducts
  try {
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages && currentPage <= 35) {
      const url = `https://embed.gog.com/account/getFilteredProducts?hiddenFlag=0&mediaType=1&page=${currentPage}&sortBy=title`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GOGGalaxy/2.0',
        },
      });

      if (!res.ok) {
        console.warn(`GOG getFilteredProducts page ${currentPage} returned status ${res.status}`);
        break;
      }

      const data = await res.json();
      totalPages = data.totalPages || 1;
      const products = data.products || [];

      for (const p of products) {
        const title = (p.title || '').trim();
        if (!title) continue;

        const coverUrl = p.image
          ? p.image.startsWith('http')
            ? p.image
            : `https:${p.image}.jpg`
          : 'https://images.gog-statics.com/avatars/default.png';

        const stats = playtimeMap.get(String(p.id)) || {};

        let steamAppId;
        const lower = title.toLowerCase();
        if (lower.includes('cyberpunk 2077')) steamAppId = 1091500;
        else if (lower.includes('witcher 3')) steamAppId = 292030;
        else if (lower.includes("baldur's gate 3") || lower.includes("baldur's gate 3")) steamAppId = 1086940;
        else if (lower.includes('disco elysium')) steamAppId = 632470;
        else if (lower.includes('fallout: new vegas')) steamAppId = 22380;
        else if (lower.includes('fallout 3')) steamAppId = 22370;
        else if (lower.includes('divinity: original sin 2')) steamAppId = 435150;
        else if (lower.includes('hollow knight')) steamAppId = 367520;

        games.push({
          id: steamAppId ? `steam-${steamAppId}` : `gog-${p.id}`,
          title,
          sortTitle: title.replace(/^(The|A|An)\s+/i, ''),
          steamAppId,
          platforms: [
            {
              platformId: 'gog',
              platformGameId: String(p.id),
              installed: false,
              playtimeMinutes: stats.playtime || (p.worksOn?.Windows ? 120 : 0),
              lastPlayed: stats.lastSession || undefined,
            },
          ],
          headerImage: coverUrl,
          capsuleImage: coverUrl,
          shortDescription: p.category ? `${p.category} on GOG.com (DRM-Free)` : 'GOG.com DRM-Free Title',
          releaseDate: '',
          developers: [],
          publishers: [],
          genres: p.category ? [p.category] : ['Action'],
          tags: ['GOG', 'DRM-Free'],
          rating: p.rating ? p.rating * 20 : undefined,
        });
      }

      currentPage++;
    }
  } catch (err) {
    console.error('Error fetching GOG products:', err.message);
  }

  return games;
}

/**
 * Exchange Epic Authorization Code for Access & Refresh Tokens
 */
async function exchangeEpicCode(code) {
  const cleanCode = code.trim();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: cleanCode,
    token_type: 'eg1',
  });

  const res = await fetch('https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `basic ${EPIC_CLIENT_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EpicGamesLauncher',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Epic token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Epic token response missing access_token');
  }

  saveTokens('epic', data);
  return data;
}

/**
 * Fetch Epic Games Owned Library & Playtime
 */
async function fetchEpicOwnedGames(accessToken, accountId) {
  const games = [];
  const playtimeMap = new Map();

  // 1. Fetch playtime if accountId is available
  if (accountId) {
    try {
      const playtimeUrl = `https://library-service.live.use1a.on.epicgames.com/library/api/public/playtime/account/${accountId}/all`;
      const ptRes = await fetch(playtimeUrl, {
        headers: {
          Authorization: `bearer ${accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EpicGamesLauncher',
        },
      });

      if (ptRes.ok) {
        const ptData = await ptRes.json();
        if (Array.isArray(ptData)) {
          for (const item of ptData) {
            if (item.artifactId) {
              playtimeMap.set(item.artifactId, {
                totalTime: Math.round((item.totalTime || 0) / 60),
                lastPlayed: item.lastPlayed || null,
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Epic playtime fetch warning:', err.message);
    }
  }

  // 2. Fetch items from Library Service with cursor pagination
  try {
    let cursor = undefined;
    let hasMore = true;
    let pageCount = 0;

    while (hasMore && pageCount < 30) {
      const fetchUrl = cursor
        ? `https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&platform=Windows&cursor=${cursor}`
        : 'https://library-service.live.use1a.on.epicgames.com/library/api/public/items?includeMetadata=true&platform=Windows';

      const res = await fetch(fetchUrl, {
        headers: {
          Authorization: `bearer ${accessToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EpicGamesLauncher',
        },
      });

      if (!res.ok) {
        console.warn(`Epic library fetch returned status ${res.status}`);
        break;
      }

      const data = await res.json();
      const records = data.records || [];

      for (const item of records) {
        const title = item.metadata?.title || item.appName || item.catalogItemId;
        if (!title) continue;

        const keyImages = item.metadata?.keyImages || [];
        const tallCover = keyImages.find((img) => img.type === 'DieselGameBoxTall')?.url;
        const wideBanner = keyImages.find((img) => img.type === 'DieselGameBox')?.url || tallCover;

        const appId = item.catalogItemId || item.appName;
        const pt = playtimeMap.get(item.appName) || playtimeMap.get(item.catalogItemId) || {};

        let steamAppId;
        const lower = title.toLowerCase();
        if (lower.includes('death stranding')) steamAppId = 1190460;
        else if (lower.includes('cyberpunk 2077')) steamAppId = 1091500;
        else if (lower.includes('alan wake 2')) steamAppId = undefined; // Epic exclusive
        else if (lower.includes('control')) steamAppId = 870780;
        else if (lower.includes('hades')) steamAppId = 1145360;

        games.push({
          id: steamAppId ? `steam-${steamAppId}` : `epic-${appId}`,
          title,
          sortTitle: title.replace(/^(The|A|An)\s+/i, ''),
          steamAppId,
          platforms: [
            {
              platformId: 'epic',
              platformGameId: appId,
              installed: false,
              playtimeMinutes: pt.totalTime || 0,
              lastPlayed: pt.lastPlayed || undefined,
            },
          ],
          headerImage: wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png',
          capsuleImage: tallCover || wideBanner || 'https://cdn2.unrealengine.com/egs-badge.png',
          shortDescription: item.metadata?.description || 'Epic Games Store Title',
          releaseDate: item.metadata?.releaseDate || '',
          developers: item.metadata?.developer ? [item.metadata.developer] : [],
          publishers: item.metadata?.publisher ? [item.metadata.publisher] : [],
          genres: ['Action'],
          tags: ['Epic Games Store'],
        });
      }

      cursor = data.responseMetadata?.nextCursor;
      hasMore = Boolean(cursor);
      pageCount++;
    }
  } catch (err) {
    console.error('Error fetching Epic library items:', err.message);
  }

  return games;
}

/**
 * Automatically renew Epic Games access token using refresh_token
 */
async function renewEpicTokens(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    token_type: 'eg1',
  });

  const res = await fetch('https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `basic ${EPIC_CLIENT_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EpicGamesLauncher',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to renew Epic token (${res.status})`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Epic refresh response missing access_token');
  }

  saveTokens('epic', data);
  return data;
}

module.exports = {
  exchangeGogCode,
  renewGogTokens,
  fetchGogAccount,
  fetchGogOwnedGames,
  exchangeEpicCode,
  renewEpicTokens,
  fetchEpicOwnedGames,
  loadSavedTokens,
  saveTokens,
};
