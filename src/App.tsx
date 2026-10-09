import { useState, useMemo, useEffect } from 'react';
import { CanonicalGame } from './contracts/game';
import { StorefrontId } from './contracts/platform';
import { GameCollection } from './contracts/collection';
import { mergeScannedSteamGames } from './services/storage/librarySync';
import { loadCollections, saveCollections } from './services/storage/collectionStorage';
import { scanLocalInstalledGames } from './services/system/localSystemScanner';
import { TopNavBar } from './components/Navigation/TopNavBar';
import { LibrarySidebar } from './components/Library/LibrarySidebar';
import { SteamStorePage } from './components/SteamStoreDetail/SteamStorePage';
import { LibraryGridView } from './components/Library/LibraryGridView';
import { ManageCollectionsModal } from './components/Library/ManageCollectionsModal';
import { IntegrationsModal } from './components/Navigation/IntegrationsModal';
import { loadIntegrations } from './services/integrations/integrationStorage';
import { steamIntegration } from './services/integrations/steamIntegration';
import {
  CheckCircle2,
  Star,
  Play,
  Clock,
  Trophy,
  Layers,
  Bookmark,
  Sliders,
} from 'lucide-react';
import { ActiveGameFilter } from './contracts/filter';
import { matchesGameFilter } from './services/filter/gameFilterService';

export function App() {
  const [games, setGames] = useState<CanonicalGame[]>(() => {
    // Clear any stale cached games with obsolete mock installed flags
    const saved = localStorage.getItem('universal_game_library_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed
            .filter((g: CanonicalGame) => g.steamAppId !== 3010850 && !g.title.toLowerCase().includes('e-day'))
            .map((g: CanonicalGame) => ({
              ...g,
              platforms: g.platforms.map((p) => ({ ...p, installed: false })),
            }));
          return mergeScannedSteamGames(cleaned);
        }
      } catch (e) {
        console.error('Failed to parse cached games:', e);
      }
    }
    return mergeScannedSteamGames([]);
  });

  // Default to Baldur's Gate 3 (or first verified owned title)
  const [selectedGame, setSelectedGame] = useState<CanonicalGame | null>(() => {
    const initialGames = mergeScannedSteamGames([]);
    return initialGames.find((g) => g.steamAppId === 1086940) || initialGames[0] || null;
  });
  const [isGridView, setIsGridView] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveGameFilter | null>(null);
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

  // Synchronize installed game status against the workstation's actual file system
  useEffect(() => {
    async function syncLocalInstallations() {
      const scanResult = await scanLocalInstalledGames();
      if (!scanResult) return;
      const installedSteamAppIds = new Set(scanResult.installedSteamAppIds);

      setGames((prevGames) => {
        let changed = false;
        const updated = prevGames.map((game) => {
          let gameChanged = false;
          const updatedPlatforms = game.platforms.map((p) => {
            if (p.platformId === 'steam') {
              const shouldBeInstalled = game.steamAppId ? installedSteamAppIds.has(game.steamAppId) : false;
              if (p.installed !== shouldBeInstalled) {
                gameChanged = true;
                return { ...p, installed: shouldBeInstalled };
              }
            } else if (p.installed) {
              gameChanged = true;
              return { ...p, installed: false };
            }
            return p;
          });

          if (gameChanged) {
            changed = true;
            return { ...game, platforms: updatedPlatforms };
          }
          return game;
        });

        if (changed) {
          localStorage.setItem('universal_game_library_catalog', JSON.stringify(updated));
          return updated;
        }
        return prevGames;
      });
    }

    syncLocalInstallations();
  }, []);

  const handleToggleInstallStatus = (gameToToggle?: CanonicalGame | null) => {
    const target = gameToToggle || selectedGame;
    if (!target) return;

    setGames((prev) => {
      const updated = prev.map((g) => {
        if (g.id === target.id) {
          const currentlyInstalled = g.platforms.some((p) => p.installed);
          const nextState = !currentlyInstalled;
          return {
            ...g,
            platforms: g.platforms.map((p) => ({ ...p, installed: nextState })),
          };
        }
        return g;
      });
      localStorage.setItem('universal_game_library_catalog', JSON.stringify(updated));
      return updated;
    });

    setSelectedGame((prev) => {
      if (!prev || prev.id !== target.id) return prev;
      const currentlyInstalled = prev.platforms.some((p) => p.installed);
      const nextState = !currentlyInstalled;
      return {
        ...prev,
        platforms: prev.platforms.map((p) => ({ ...p, installed: nextState })),
      };
    });
  };

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

      // Temporary Active Link Filter (Developer, Publisher, Feature like HDR available, Genre, Tag)
      if (activeFilter) {
        if (!matchesGameFilter(game, activeFilter)) return false;
      }

      return true;
    });
  }, [games, selectedPlatform, installedOnly, searchQuery, activeFilter]);

  // Active group data for grid view filtering
  const activeGroupData = useMemo(() => {
    if (!activeGroupId) return null;

    if (activeGroupId === 'uncategorized') {
      const categorizedIds = new Set(collections.flatMap((c) => c.gameIds));
      const groupGames = filteredGames.filter((g) => !categorizedIds.has(g.id));
      return {
        id: 'uncategorized',
        name: 'Uncategorized',
        games: groupGames,
        subtitle: 'Games that have not been assigned to any user collection',
      };
    }

    const col = collections.find((c) => c.id === activeGroupId);
    if (!col) return null;

    const groupGames = filteredGames.filter((g) => col.gameIds.includes(g.id));
    return {
      id: col.id,
      name: col.name,
      games: groupGames,
      subtitle: `Viewing titles in the ${col.name} collection`,
    };
  }, [activeGroupId, collections, filteredGames]);

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
          setActiveFilter(null);
          setActiveGroupId(null);
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
          collections={collections}
          onOpenManageCollectionsModal={handleOpenManageCollections}
          onToggleGameInCollection={handleToggleGameInCollection}
          onViewAllGamesGrid={() => {
            setActiveFilter(null);
            setActiveGroupId(null);
            setIsGridView(true);
          }}
          onSelectGroupGrid={(groupId) => {
            setActiveFilter(null);
            setActiveGroupId(groupId);
            setIsGridView(true);
          }}
          activeGroupId={activeGroupId}
          isGridView={isGridView}
          activeFilter={activeFilter}
          onClearActiveFilter={() => setActiveFilter(null)}
        />

        {/* Right Main Pane: Steam Storefront Detail Layout OR Group/Whole Library Grid View */}
        <main className="flex-1 h-full overflow-y-auto bg-[#0b0f14] relative">
          {isGridView || !selectedGame ? (
            <LibraryGridView
              games={activeGroupData ? activeGroupData.games : filteredGames}
              onSelectGame={(game) => {
                setSelectedGame(game);
                setIsGridView(false);
              }}
              searchQuery={searchQuery}
              title={
                activeFilter
                  ? `${activeFilter.label}: ${activeFilter.value}`
                  : activeGroupData
                  ? activeGroupData.name
                  : 'All Games'
              }
              subtitle={
                activeFilter
                  ? `Showing all games matching "${activeFilter.value}"`
                  : activeGroupData
                  ? activeGroupData.subtitle
                  : undefined
              }
              groupIcon={
                activeFilter ? (
                  <Sliders className="w-6 h-6 text-steam-accent" />
                ) : activeGroupId === 'favorites' ? (
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                ) : activeGroupId === 'currently-playing' ? (
                  <Play className="w-6 h-6 fill-emerald-400 text-emerald-400" />
                ) : activeGroupId === 'backlog' ? (
                  <Clock className="w-6 h-6 text-sky-400" />
                ) : activeGroupId === 'completed' ? (
                  <Trophy className="w-6 h-6 text-yellow-400" />
                ) : activeGroupId === 'uncategorized' ? (
                  <Layers className="w-6 h-6 text-sky-400" />
                ) : activeGroupId ? (
                  <Bookmark className="w-6 h-6 text-steam-accent" />
                ) : undefined
              }
              onClearGroupFilter={activeGroupId ? () => setActiveGroupId(null) : undefined}
              activeFilter={activeFilter}
              onClearActiveFilter={() => setActiveFilter(null)}
            />
          ) : (
            <SteamStorePage
              game={selectedGame}
              parentGroupName={
                activeFilter
                  ? `${activeFilter.label}: ${activeFilter.value}`
                  : activeGroupData
                  ? activeGroupData.name
                  : 'All Games'
              }
              onBackToLibrary={() => setIsGridView(true)}
              onManageCollections={() => handleOpenManageCollections(selectedGame)}
              onToggleInstallStatus={() => handleToggleInstallStatus(selectedGame)}
              onApplyFilter={(filter) => {
                setActiveFilter(filter);
                setIsGridView(true);
              }}
            />
          )}
        </main>
      </div>

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
          localStorage.setItem('universal_game_library_catalog', JSON.stringify(newGames));
          if (newGames.length > 0 && (!selectedGame || !newGames.some((g) => g.id === selectedGame.id))) {
            setSelectedGame(newGames[0]);
          }
        }}
      />
    </div>
  );
}

export default App;
