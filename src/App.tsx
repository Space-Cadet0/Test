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
import {
  loadIntegrations,
  mergeStorefrontGames,
  saveCurrentCatalog,
  connectGogIntegration,
  connectEpicIntegration,
  connectXboxIntegration,
} from './services/integrations/integrationStorage';
import { steamIntegration } from './services/integrations/steamIntegration';
import { steamMatcher } from './services/steam/steamMatcher';
import { sanitizeGameCatalog } from './services/integrations/catalogSanitizer';
import { GOG_USER_LIBRARY, EPIC_USER_LIBRARY } from './services/storage/storefrontLibraries';
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
import { useNavigationHistory } from './hooks/useNavigationHistory';

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
          let sanitized = sanitizeGameCatalog(mergeScannedSteamGames(cleaned));

          const gogCount = sanitized.filter((g: CanonicalGame) => g.platforms?.some((p) => p.platformId === 'gog')).length;
          if (gogCount !== GOG_USER_LIBRARY.length) {
            sanitized = sanitizeGameCatalog(mergeStorefrontGames(sanitized, GOG_USER_LIBRARY, 'gog'));
          }

          const epicCount = sanitized.filter((g: CanonicalGame) => g.platforms?.some((p) => p.platformId === 'epic')).length;
          if (epicCount !== EPIC_USER_LIBRARY.length) {
            sanitized = sanitizeGameCatalog(mergeStorefrontGames(sanitized, EPIC_USER_LIBRARY, 'epic'));
          }

          try {
            localStorage.setItem('universal_game_library_catalog', JSON.stringify(sanitized));
          } catch {}
          return sanitized;
        }
      } catch (e) {
        console.error('Failed to parse cached games:', e);
      }
    }
    const defaultCatalog = sanitizeGameCatalog(
      mergeStorefrontGames(
        mergeStorefrontGames(mergeScannedSteamGames([]), GOG_USER_LIBRARY, 'gog'),
        EPIC_USER_LIBRARY,
        'epic'
      )
    );
    try {
      localStorage.setItem('universal_game_library_catalog', JSON.stringify(defaultCatalog));
    } catch {}
    return defaultCatalog;
  });

  // Navigation history & state stack
  const initialGame = useMemo(() => {
    const initialGames = sanitizeGameCatalog(mergeScannedSteamGames([]));
    return initialGames.find((g) => g.steamAppId === 1086940) || initialGames[0] || null;
  }, []);

  const {
    currentEntry,
    canGoBack,
    backTitle,
    canGoForward,
    forwardTitle,
    pushEntry,
    goBack,
    goForward,
  } = useNavigationHistory({
    view: 'game',
    selectedGameId: initialGame?.id || 'steam-1086940',
    activeFilter: null,
    activeGroupId: null,
    title: initialGame?.title || "Baldur's Gate 3",
  });

  const isGridView = currentEntry.view === 'grid';
  const activeGroupId = currentEntry.activeGroupId;
  const activeFilter = currentEntry.activeFilter;

  const selectedGame = useMemo(() => {
    if (!currentEntry.selectedGameId) {
      return games[0] || null;
    }
    return games.find((g) => g.id === currentEntry.selectedGameId) || games[0] || null;
  }, [games, currentEntry.selectedGameId]);

  const navigateSelectGame = (game: CanonicalGame) => {
    pushEntry({
      view: 'game',
      selectedGameId: game.id,
      activeFilter: null,
      activeGroupId: null,
      title: game.title,
    });
  };

  const navigateApplyFilter = (filter: ActiveGameFilter) => {
    pushEntry({
      view: 'grid',
      selectedGameId: selectedGame?.id || null,
      activeFilter: filter,
      activeGroupId: null,
      title: `${filter.label}: ${filter.value}`,
    });
  };

  const navigateHome = () => {
    pushEntry({
      view: 'grid',
      selectedGameId: selectedGame?.id || null,
      activeFilter: null,
      activeGroupId: null,
      title: 'All Games',
    });
  };

  const navigateSelectGroup = (groupId: string | null) => {
    if (!groupId) {
      navigateHome();
      return;
    }
    const colName =
      groupId === 'uncategorized'
        ? 'Uncategorized'
        : collections.find((c) => c.id === groupId)?.name || 'Collection';
    pushEntry({
      view: 'grid',
      selectedGameId: selectedGame?.id || null,
      activeFilter: null,
      activeGroupId: groupId,
      title: colName,
    });
  };

  const navigateClearFilter = () => {
    pushEntry({
      view: 'grid',
      selectedGameId: selectedGame?.id || null,
      activeFilter: null,
      activeGroupId: activeGroupId,
      title: activeGroupId
        ? collections.find((c) => c.id === activeGroupId)?.name || 'Collection'
        : 'All Games',
    });
  };
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

  // Trigger library cloud sync across all connected storefronts (Steam, GOG, Epic, Xbox)
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncNotice('Syncing all connected storefront accounts & detecting new purchases...');

    try {
      const integrations = loadIntegrations();
      let currentCatalog = games;
      const initialCount = currentCatalog.length;

      // 1. Steam sync
      const steamInteg = integrations.find((i) => i.storefrontId === 'steam' && i.isConnected);
      if (steamInteg?.credentials?.steamId) {
        try {
          const res = await steamIntegration.fetchOwnedGames(steamInteg.credentials);
          currentCatalog = mergeStorefrontGames(currentCatalog, res.games, 'steam');
        } catch (e) {
          console.warn('Steam sync warning:', e);
        }
      }

      // 2. GOG sync (via Electron native store:sync or web fallback)
      const gogInteg = integrations.find((i) => i.storefrontId === 'gog' && i.isConnected);
      if (gogInteg) {
        try {
          if (typeof window !== 'undefined' && (window as any).electronAPI?.syncStore) {
            const gogRes = await (window as any).electronAPI.syncStore('gog');
            if (gogRes?.success && gogRes.games?.length > 0) {
              currentCatalog = mergeStorefrontGames(currentCatalog, gogRes.games, 'gog');
            }
          } else {
            const { games: gogGames } = await connectGogIntegration(gogInteg.credentials || {});
            currentCatalog = mergeStorefrontGames(currentCatalog, gogGames, 'gog');
          }
        } catch (e) {
          console.warn('GOG sync warning:', e);
        }
      }

      // 3. Epic Games Store sync (via Electron native store:sync or web fallback)
      const epicInteg = integrations.find((i) => i.storefrontId === 'epic' && i.isConnected);
      if (epicInteg) {
        try {
          if (typeof window !== 'undefined' && (window as any).electronAPI?.syncStore) {
            const epicRes = await (window as any).electronAPI.syncStore('epic');
            if (epicRes?.success && epicRes.games?.length > 0) {
              currentCatalog = mergeStorefrontGames(currentCatalog, epicRes.games, 'epic');
            }
          } else {
            const { games: epicGames } = await connectEpicIntegration(epicInteg.credentials || {});
            currentCatalog = mergeStorefrontGames(currentCatalog, epicGames, 'epic');
          }
        } catch (e) {
          console.warn('Epic sync warning:', e);
        }
      }

      // 4. Xbox sync
      const xboxInteg = integrations.find((i) => i.storefrontId === 'xbox' && i.isConnected);
      if (xboxInteg) {
        try {
          const { games: xboxGames } = await connectXboxIntegration(xboxInteg.credentials || {});
          currentCatalog = mergeStorefrontGames(currentCatalog, xboxGames, 'xbox');
        } catch (e) {
          console.warn('Xbox sync warning:', e);
        }
      }

      // 5. Intelligent Steam Match Pass for Non-Steam Titles
      currentCatalog = currentCatalog.map((g) => {
        if (g.steamAppId) return g;
        const matched = steamMatcher.matchGameToSteamInstant(g.title);
        if (matched) {
          return {
            ...g,
            steamAppId: matched,
            id: `steam-${matched}`,
            headerImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${matched}/header.jpg`,
            capsuleImage: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${matched}/library_600x900_2x.jpg`,
          };
        }
        return g;
      });

      // 6. Final catalog sanitization (removes raw hex hashes & Fortnite DLC entries)
      currentCatalog = sanitizeGameCatalog(currentCatalog);

      const newGamesDetected = Math.max(0, currentCatalog.length - initialCount);
      setGames(currentCatalog);
      saveCurrentCatalog(currentCatalog);

      if (newGamesDetected > 0) {
        setSyncNotice(
          `Sync complete! Detected ${newGamesDetected} newly added title${newGamesDetected === 1 ? '' : 's'} across your storefronts! (${currentCatalog.length} total titles)`
        );
      } else {
        setSyncNotice(
          `All connected libraries are up to date! (${currentCatalog.length} titles synchronized across Steam, GOG, Epic)`
        );
      }
    } catch (err: any) {
      setSyncNotice(`Sync notice: ${err?.message || 'Using cached verified catalog'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncNotice(null), 5000);
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
        onHomeClick={navigateHome}
        canGoBack={canGoBack}
        onGoBack={goBack}
        backTitle={backTitle}
        canGoForward={canGoForward}
        onGoForward={goForward}
        forwardTitle={forwardTitle}
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
            navigateSelectGame(game);
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
          onViewAllGamesGrid={navigateHome}
          onSelectGroupGrid={(groupId) => {
            navigateSelectGroup(groupId);
          }}
          activeGroupId={activeGroupId}
          isGridView={isGridView}
          activeFilter={activeFilter}
          onClearActiveFilter={navigateClearFilter}
        />

        {/* Right Main Pane: Steam Storefront Detail Layout OR Group/Whole Library Grid View */}
        <main className="flex-1 h-full overflow-y-auto bg-[#0b0f14] relative">
          {isGridView || !selectedGame ? (
            <LibraryGridView
              games={activeGroupData ? activeGroupData.games : filteredGames}
              onSelectGame={(game) => {
                navigateSelectGame(game);
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
              onClearGroupFilter={activeGroupId ? navigateHome : undefined}
              activeFilter={activeFilter}
              onClearActiveFilter={navigateClearFilter}
              canGoBack={canGoBack}
              onGoBack={goBack}
              backTitle={backTitle}
            />
          ) : (
            <SteamStorePage
              key={selectedGame.id}
              game={selectedGame}
              parentGroupName={
                activeFilter
                  ? `${activeFilter.label}: ${activeFilter.value}`
                  : activeGroupData
                  ? activeGroupData.name
                  : 'All Games'
              }
              onBackToLibrary={navigateHome}
              onManageCollections={() => handleOpenManageCollections(selectedGame)}
              onToggleInstallStatus={() => handleToggleInstallStatus(selectedGame)}
              onApplyFilter={(filter) => {
                navigateApplyFilter(filter);
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
            navigateSelectGame(newGames[0]);
          }
        }}
      />
    </div>
  );
}

export default App;
