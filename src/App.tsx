import { useState, useMemo } from 'react';
import { CanonicalGame } from './contracts/game';
import { StorefrontId } from './contracts/platform';
import { INITIAL_LIBRARY_GAMES } from './services/storage/mockLibrary';
import { steamApi } from './services/steam/steamApi';
import { TopNavBar } from './components/Navigation/TopNavBar';
import { GameGrid } from './components/Library/GameGrid';
import { SteamStorePage } from './components/SteamStoreDetail/SteamStorePage';
import { Plus, Sparkles, CheckCircle2 } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<CanonicalGame[]>(INITIAL_LIBRARY_GAMES);
  const [selectedGame, setSelectedGame] = useState<CanonicalGame | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<StorefrontId | 'all'>('all');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Quick import state
  const [importInput, setImportInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Filtered games list
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Platform filter
      if (selectedPlatform !== 'all') {
        const hasPlatform = game.platforms.some((p) => p.platformId === selectedPlatform);
        if (!hasPlatform) return false;
      }

      // Installed filter
      if (installedOnly) {
        const isInstalled = game.platforms.some((p) => p.installed);
        if (!isInstalled) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = game.title.toLowerCase().includes(q);
        const matchesDev = game.developers.some((d) => d.toLowerCase().includes(q));
        const matchesTags = game.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDev && !matchesTags) return false;
      }

      return true;
    });
  }, [games, selectedPlatform, installedOnly, searchQuery]);

  // Handle live Steam import by URL or App ID
  const handleImportSteamGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importInput.trim()) return;

    setImportError(null);
    setIsImporting(true);

    try {
      // Extract AppID from URL or raw number
      let appId: number | null = null;
      const match = importInput.match(/app\/(\d+)/i);
      if (match) {
        appId = parseInt(match[1], 10);
      } else if (/^\d+$/.test(importInput.trim())) {
        appId = parseInt(importInput.trim(), 10);
      } else {
        // Try searching by title
        appId = await steamApi.searchAppId(importInput.trim());
      }

      if (!appId) {
        setImportError('Could not find Steam AppID for this input.');
        setIsImporting(false);
        return;
      }

      const meta = await steamApi.fetchGameMetadata(appId);
      if (!meta) {
        setImportError(`Failed to fetch metadata from Steam for AppID ${appId}.`);
        setIsImporting(false);
        return;
      }

      // Check if already in library
      const existing = games.find((g) => g.steamAppId === appId);
      if (existing) {
        setSelectedGame(existing);
        setImportInput('');
        setIsImporting(false);
        return;
      }

      // Construct new CanonicalGame
      const newGame: CanonicalGame = {
        id: `steam-${appId}`,
        title: meta.name,
        sortTitle: meta.name,
        steamAppId: appId,
        platforms: [
          {
            platformId: 'steam',
            platformGameId: String(appId),
            installed: false,
          },
        ],
        headerImage: meta.headerImage,
        shortDescription: meta.shortDescription,
        releaseDate: meta.releaseDate,
        developers: meta.developers,
        publishers: meta.publishers,
        genres: meta.genres,
        tags: meta.tags,
        reviewSummary: meta.reviewSummary,
        enrichedMetadata: meta,
      };

      setGames((prev) => [newGame, ...prev]);
      setSelectedGame(newGame);
      setImportInput('');
    } catch (err: any) {
      setImportError(err.message || 'Error importing game.');
    } finally {
      setIsImporting(false);
    }
  };

  // Trigger library sync simulation
  const handleTriggerSync = () => {
    setIsSyncing(true);
    setSyncNotice('Scanning local Steam manifests and sync endpoints...');

    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice('Library sync complete! 10 multi-platform titles indexed.');
      setTimeout(() => setSyncNotice(null), 4000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0e141b] text-steam-text flex flex-col font-steam">
      {/* Top Custom Navigation Bar */}
      <TopNavBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={(p) => {
          setSelectedPlatform(p);
          setSelectedGame(null); // return to grid when filtering
        }}
        installedOnly={installedOnly}
        onToggleInstalledOnly={() => setInstalledOnly(!installedOnly)}
        totalGamesCount={games.length}
        filteredCount={filteredGames.length}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onHomeClick={() => setSelectedGame(null)}
      />

      {/* Sync Status Banner */}
      {syncNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/50 py-2 px-4 text-center text-xs text-emerald-300 flex items-center justify-center gap-2 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncNotice}
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {selectedGame ? (
          /* Steam Store Detail Page Clone */
          <SteamStorePage
            game={selectedGame}
            onBackToLibrary={() => setSelectedGame(null)}
          />
        ) : (
          /* Unified Library Grid View */
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            {/* Quick Add Game by Steam URL / App ID bar */}
            <div className="bg-[#16202d] border border-steam-border p-4 rounded shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-steam-accent" />
                  Live Steam Scraper & Importer
                </h2>
                <p className="text-xs text-steam-subtext">
                  Paste any Steam store URL (e.g. Gears of War: E-Day) or AppID to scrape reviews, trailers, and media.
                </p>
              </div>

              <form onSubmit={handleImportSteamGame} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="https://store.steampowered.com/app/... or 3010850"
                  className="px-3 py-1.5 text-xs bg-[#10141a] text-white placeholder-steam-subtext rounded border border-steam-border focus:border-steam-accent focus:outline-none w-full md:w-80"
                />
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-steam-btnGreen hover:bg-steam-btnGreenHover text-white rounded transition-colors flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isImporting ? 'Scraping...' : 'Import'}
                </button>
              </form>
            </div>

            {importError && (
              <div className="p-2.5 bg-red-950/60 border border-red-700/60 rounded text-xs text-red-300">
                {importError}
              </div>
            )}

            {/* Catalog Grid */}
            <GameGrid games={filteredGames} onSelectGame={setSelectedGame} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
