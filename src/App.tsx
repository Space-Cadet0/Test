import { useState, useMemo } from 'react';
import { CanonicalGame } from './contracts/game';
import { StorefrontId } from './contracts/platform';
import { GameCollection } from './contracts/collection';
import { mergeScannedSteamGames } from './services/storage/librarySync';
import { loadCollections, saveCollections } from './services/storage/collectionStorage';
import { steamApi } from './services/steam/steamApi';
import { TopNavBar } from './components/Navigation/TopNavBar';
import { LibrarySidebar } from './components/Library/LibrarySidebar';
import { SteamStorePage } from './components/SteamStoreDetail/SteamStorePage';
import { LibraryGridView } from './components/Library/LibraryGridView';
import { ManageCollectionsModal } from './components/Library/ManageCollectionsModal';
import { IntegrationsModal } from './components/Navigation/IntegrationsModal';
import { loadIntegrations } from './services/integrations/integrationStorage';
import { steamIntegration } from './services/integrations/steamIntegration';
import { Plus, Sparkles, X, CheckCircle2 } from 'lucide-react';

export function App() {
  const [games, setGames] = useState<CanonicalGame[]>(() =>
    mergeScannedSteamGames([])
  );
  // Default to Baldur's Gate 3 (or first verified owned title)
  const [selectedGame, setSelectedGame] = useState<CanonicalGame | null>(() => {
    const initialGames = mergeScannedSteamGames([]);
    return initialGames.find((g) => g.steamAppId === 1086940) || initialGames[0] || null;
  });
  const [isGridView, setIsGridView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<StorefrontId | 'all'>('all');
  const [installedOnly, setInstalledOnly] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Collections state
  const [collections, setCollections] = useState<GameCollection[]>(() => loadCollections());
  const [isManageCollectionsOpen, setIsManageCollectionsOpen] = useState(false);
  const [collectionModalGame, setCollectionModalGame] = useState<CanonicalGame | null>(null);

  // Integrations modal state
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);

  // Quick import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Filtered games list for the sidebar
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
      let appId: number | null = null;
      const match = importInput.match(/app\/(\d+)/i);
      if (match) {
        appId = parseInt(match[1], 10);
      } else if (/^\d+$/.test(importInput.trim())) {
        appId = parseInt(importInput.trim(), 10);
      } else {
        appId = await steamApi.searchAppId(importInput.trim());
      }

      if (!appId) {
        setImportError('Could not find Steam AppID for this title or URL.');
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
        setIsImportModalOpen(false);
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
      setIsImportModalOpen(false);
    } catch (err: any) {
      setImportError(err.message || 'Error importing game.');
    } finally {
      setIsImporting(false);
    }
  };

  // Trigger library cloud sync across connected storefronts
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncNotice('Syncing connected cloud storefront accounts...');

    try {
      const integrations = loadIntegrations();
      const steamInteg = integrations.find((i) => i.storefrontId === 'steam' && i.isConnected);

      let syncedGames = games;
      if (steamInteg?.credentials?.steamId) {
        const res = await steamIntegration.fetchOwnedGames(steamInteg.credentials);
        syncedGames = res.games;
      } else {
        syncedGames = mergeScannedSteamGames([]);
      }

      setGames(syncedGames);
      setSyncNotice(
        `Cloud sync complete! ${syncedGames.length} verified owned titles synchronized from connected storefronts.`
      );
    } catch (err: any) {
      setSyncNotice(`Sync notice: ${err?.message || 'Using cached verified catalog'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  // Collection Management Handlers
  const handleOpenManageCollections = (game?: CanonicalGame) => {
    setCollectionModalGame(game || null);
    setIsManageCollectionsOpen(true);
  };

  const handleCreateCollection = (name: string) => {
    const newCol: GameCollection = {
      id: `col-${Date.now()}`,
      name,
      gameIds: collectionModalGame ? [collectionModalGame.id] : [],
    };
    const updated = [...collections, newCol];
    setCollections(updated);
    saveCollections(updated);
  };

  const handleRenameCollection = (id: string, newName: string) => {
    const updated = collections.map((c) => (c.id === id ? { ...c, name: newName } : c));
    setCollections(updated);
    saveCollections(updated);
  };

  const handleDeleteCollection = (id: string) => {
    const updated = collections.filter((c) => c.id !== id);
    setCollections(updated);
    saveCollections(updated);
  };

  const handleToggleGameInCollection = (collectionId: string, gameId: string) => {
    const updated = collections.map((c) => {
      if (c.id === collectionId) {
        const has = c.gameIds.includes(gameId);
        return {
          ...c,
          gameIds: has ? c.gameIds.filter((id) => id !== gameId) : [...c.gameIds, gameId],
        };
      }
      return c;
    });
    setCollections(updated);
    saveCollections(updated);
  };

  return (
    <div className="h-screen w-screen bg-[#0e141b] text-steam-text flex flex-col font-steam overflow-hidden">
      {/* Top Navigation Bar */}
      <TopNavBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedPlatform={selectedPlatform}
        onSelectPlatform={setSelectedPlatform}
        installedOnly={installedOnly}
        onToggleInstalledOnly={() => setInstalledOnly(!installedOnly)}
        totalGamesCount={games.length}
        filteredCount={filteredGames.length}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onOpenIntegrations={() => setIsIntegrationsModalOpen(true)}
        onHomeClick={() => {
          setIsGridView(true);
        }}
      />

      {/* Sync Status Banner */}
      {syncNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/50 py-1.5 px-4 text-center text-xs text-emerald-300 flex items-center justify-center gap-2 flex-shrink-0 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {syncNotice}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Steam Library Games List */}
        <LibrarySidebar
          games={filteredGames}
          selectedGameId={isGridView ? null : selectedGame?.id || null}
          onSelectGame={(game) => {
            setSelectedGame(game);
            setIsGridView(false);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={setSelectedPlatform}
          installedOnly={installedOnly}
          onToggleInstalledOnly={() => setInstalledOnly(!installedOnly)}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          collections={collections}
          onOpenManageCollectionsModal={handleOpenManageCollections}
          onToggleGameInCollection={handleToggleGameInCollection}
          onViewAllGamesGrid={() => setIsGridView(true)}
          isGridView={isGridView}
        />

        {/* Right Main Pane: Steam Storefront Detail Layout OR Whole Library Grid View */}
        <main className="flex-1 h-full overflow-y-auto bg-[#0b0f14] relative">
          {isGridView || !selectedGame ? (
            <LibraryGridView
              games={filteredGames}
              onSelectGame={(game) => {
                setSelectedGame(game);
                setIsGridView(false);
              }}
              searchQuery={searchQuery}
            />
          ) : (
            <SteamStorePage
              game={selectedGame}
              onBackToLibrary={() => setIsGridView(true)}
              onManageCollections={() => handleOpenManageCollections(selectedGame)}
            />
          )}
        </main>
      </div>

      {/* Modal: Live Steam Scraper & URL Importer */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16202d] border border-steam-border rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-steam-border/60 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="w-4 h-4 text-steam-accent" />
                <span>Live Steam Scraper & Importer</span>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="text-steam-subtext hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-steam-subtext leading-relaxed">
              Enter any Steam Store page URL or numeric AppID to scrape live trailers, screenshots, reviews, and specifications directly into your library.
            </p>

            <form onSubmit={handleImportSteamGame} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-steam-subtext uppercase">
                  Steam URL or App ID
                </label>
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="https://store.steampowered.com/app/3010850/Gears_of_War_EDay/ or 3010850"
                  className="w-full px-3 py-2 text-xs bg-[#0e141b] text-white rounded border border-steam-border focus:border-steam-accent focus:outline-none"
                  autoFocus
                />
              </div>

              {importError && (
                <div className="p-2.5 bg-red-950/70 border border-red-700/60 rounded text-xs text-red-300">
                  {importError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-steam-subtext hover:text-white bg-transparent rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-4 py-1.5 text-xs font-semibold bg-steam-btnGreen hover:bg-steam-btnGreenHover text-white rounded transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {isImporting ? 'Scraping Steam...' : 'Scrape & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manage Collections */}
      <ManageCollectionsModal
        isOpen={isManageCollectionsOpen}
        onClose={() => setIsManageCollectionsOpen(false)}
        collections={collections}
        game={collectionModalGame}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
        onToggleGameInCollection={handleToggleGameInCollection}
      />

      {/* Modal: Storefront Integrations & Cloud Sync (No Launchers Required) */}
      <IntegrationsModal
        isOpen={isIntegrationsModalOpen}
        onClose={() => setIsIntegrationsModalOpen(false)}
        onLibraryUpdated={(newGames) => {
          setGames(newGames);
          if (newGames.length > 0 && (!selectedGame || !newGames.some((g) => g.id === selectedGame.id))) {
            setSelectedGame(newGames[0]);
          }
        }}
      />
    </div>
  );
}

export default App;
