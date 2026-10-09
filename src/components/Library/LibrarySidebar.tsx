import React, { useState, useMemo } from 'react';
import { CanonicalGame } from '../../contracts/game';
import { STOREFRONT_REGISTRY, StorefrontId } from '../../contracts/platform';
import { GameCollection } from '../../contracts/collection';
import {
  Gamepad2,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Star,
  MoreVertical,
  List,
  FolderTree,
  Bookmark
} from 'lucide-react';

interface LibrarySidebarProps {
  games: CanonicalGame[];
  selectedGameId: string | null;
  onSelectGame: (game: CanonicalGame) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPlatform: StorefrontId | 'all';
  onSelectPlatform: (p: StorefrontId | 'all') => void;
  installedOnly: boolean;
  onToggleInstalledOnly: () => void;
  onOpenImportModal: () => void;
  collections: GameCollection[];
  onOpenManageCollectionsModal: (game?: CanonicalGame) => void;
  onToggleGameInCollection: (collectionId: string, gameId: string) => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  games,
  selectedGameId,
  onSelectGame,
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onSelectPlatform,
  installedOnly,
  onToggleInstalledOnly,
  onOpenImportModal,
  collections,
  onOpenManageCollectionsModal,
  onToggleGameInCollection,
}) => {
  const [groupByCollections, setGroupByCollections] = useState(true);
  const [collapsedCollections, setCollapsedCollections] = useState<Record<string, boolean>>({});

  const platforms: (StorefrontId | 'all')[] = [
    'all',
    'steam',
    'gog',
    'epic',
    'amazon',
    'xbox',
    'ubisoft',
    'ea',
    'bnet',
    'itch',
  ];

  const toggleCollectionCollapse = (id: string) => {
    setCollapsedCollections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Group games into collections + uncategorized
  const groupedData = useMemo(() => {
    const gameMap = new Map<string, CanonicalGame>();
    games.forEach((g) => gameMap.set(g.id, g));

    const categorizedGameIds = new Set<string>();

    const colGroups = collections.map((col) => {
      const colGames = col.gameIds
        .map((id) => gameMap.get(id))
        .filter((g): g is CanonicalGame => !!g);

      colGames.forEach((g) => categorizedGameIds.add(g.id));

      return {
        ...col,
        games: colGames,
      };
    });

    // Uncategorized: games in the filtered list not in any collection
    const uncategorizedGames = games.filter((g) => !categorizedGameIds.has(g.id));

    return {
      collections: colGroups,
      uncategorized: uncategorizedGames,
    };
  }, [games, collections]);

  const renderGameRow = (game: CanonicalGame) => {
    const isSelected = game.id === selectedGameId;
    const isInstalled = game.platforms.some((p) => p.installed);
    const isFav = collections.find((c) => c.id === 'favorites')?.gameIds.includes(game.id) || false;

    return (
      <div
        key={game.id}
        onClick={() => onSelectGame(game)}
        className={`relative px-3 py-1.5 flex items-center gap-2 cursor-pointer transition-all group select-none ${
          isSelected
            ? 'bg-[#223547] text-white border-l-4 border-steam-accent shadow-inner'
            : 'text-steam-text hover:bg-[#1a212b] hover:text-white border-l-4 border-transparent'
        }`}
      >
        {/* Small Thumbnail Icon */}
        <div className="w-6 h-6 rounded bg-black/60 overflow-hidden flex-shrink-0 border border-steam-border/40 group-hover:border-steam-accent/50">
          <img
            src={game.headerImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Game Title & Badges */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs truncate font-medium ${
                isSelected ? 'text-white font-semibold' : 'group-hover:text-white'
              }`}
            >
              {game.title}
            </span>
            {isInstalled && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
                title="Installed Locally"
              />
            )}
          </div>
        </div>

        {/* Actions on Hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Favorite Star Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleGameInCollection('favorites', game.id);
            }}
            className={`p-1 rounded hover:bg-black/40 transition-colors ${
              isFav ? 'text-amber-400 opacity-100' : 'text-steam-subtext hover:text-amber-400'
            }`}
            title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
          >
            <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Manage Collections Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenManageCollectionsModal(game);
            }}
            className="p-1 text-steam-subtext hover:text-white rounded hover:bg-black/40 transition-colors"
            title="Manage Collections"
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>

        {/* Persistent Favorite Star if active and not hovered */}
        {isFav && (
          <div className="group-hover:hidden">
            <Star className="w-2.5 h-2.5 fill-amber-400/80 text-amber-400/80" />
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 md:w-80 h-full bg-[#12161d] border-r border-steam-border flex flex-col flex-shrink-0 select-none">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-steam-border/60 space-y-2.5 bg-[#161a22]">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-steam-subtext pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, genre, dev..."
            className="w-full bg-[#10141b] border border-steam-border rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-steam-subtext focus:outline-none focus:border-steam-accent transition-colors"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center justify-between text-xs">
          {/* Storefront Filter Dropdown */}
          <div className="relative group">
            <div className="flex items-center gap-1 text-[11px] text-steam-subtext hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-steam-card">
              <Filter className="w-3 h-3 text-steam-accent" />
              <span className="capitalize font-medium">
                {selectedPlatform === 'all'
                  ? 'All Stores'
                  : STOREFRONT_REGISTRY[selectedPlatform]?.name || selectedPlatform}
              </span>
              <ChevronDown className="w-3 h-3 text-steam-subtext" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute left-0 top-full mt-1 w-44 bg-[#1b222d] border border-steam-border rounded shadow-xl py-1 z-50 hidden group-hover:block">
              {platforms.map((p) => {
                const name =
                  p === 'all'
                    ? 'All Storefronts'
                    : STOREFRONT_REGISTRY[p]?.name || p.toUpperCase();
                return (
                  <button
                    key={p}
                    onClick={() => onSelectPlatform(p)}
                    className={`w-full text-left px-3 py-1 text-xs flex items-center justify-between hover:bg-steam-border transition-colors ${
                      selectedPlatform === p ? 'text-steam-accent font-bold' : 'text-steam-text'
                    }`}
                  >
                    <span>{name}</span>
                    {selectedPlatform === p && <span className="w-1.5 h-1.5 rounded-full bg-steam-accent" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Installed toggle button */}
          <button
            onClick={onToggleInstalledOnly}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors flex items-center gap-1 ${
              installedOnly
                ? 'bg-emerald-950/80 text-emerald-400 font-semibold border border-emerald-600/50'
                : 'text-steam-subtext hover:text-white hover:bg-steam-card'
            }`}
            title="Filter by locally installed titles only"
          >
            <CheckCircle2 className={`w-3 h-3 ${installedOnly ? 'text-emerald-400' : 'text-steam-subtext'}`} />
            <span>Ready to Play</span>
          </button>
        </div>
      </div>

      {/* Category Section Header & Grouping Controls */}
      <div className="px-3 py-1.5 bg-[#171c24] border-b border-steam-border/40 flex items-center justify-between text-[11px] text-steam-subtext select-none">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByCollections(!groupByCollections)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider font-semibold ${
              groupByCollections
                ? 'text-steam-accent bg-[#1f2d3d]'
                : 'text-steam-subtext hover:text-white'
            }`}
            title={groupByCollections ? 'Switch to Flat List' : 'Switch to Group by Collections'}
          >
            {groupByCollections ? <FolderTree className="w-3 h-3" /> : <List className="w-3 h-3" />}
            <span>{groupByCollections ? 'Collections' : 'All Games'} ({games.length})</span>
          </button>
        </div>

        {/* Action Buttons: Add Collection & Add Game */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenManageCollectionsModal()}
            className="text-steam-subtext hover:text-white flex items-center gap-1 text-[11px] hover:underline"
            title="Create or manage collections"
          >
            <FolderPlus className="w-3 h-3 text-steam-accent" />
            <span className="hidden sm:inline">+ Group</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="text-steam-accent hover:text-white flex items-center gap-1 text-[11px] hover:underline"
            title="Scrape and import a new game"
          >
            <Sparkles className="w-3 h-3" />
            <span>+ Game</span>
          </button>
        </div>
      </div>

      {/* Games List (Grouped or Flat) */}
      <div className="flex-1 overflow-y-auto py-1">
        {games.length === 0 ? (
          <div className="p-6 text-center text-xs text-steam-subtext space-y-2">
            <Gamepad2 className="w-8 h-8 text-steam-subtext/30 mx-auto" />
            <p>No titles found matching criteria.</p>
          </div>
        ) : groupByCollections ? (
          /* Grouped by Collections Mode */
          <div className="space-y-1">
            {/* User Collections */}
            {groupedData.collections.map((col) => {
              if (col.games.length === 0 && searchQuery) return null; // hide empty collections during search
              const isCollapsed = !!collapsedCollections[col.id];

              return (
                <div key={col.id} className="mb-0.5">
                  {/* Collection Header */}
                  <div
                    onClick={() => toggleCollectionCollapse(col.id)}
                    className="px-3 py-1 bg-[#141a22] hover:bg-[#1b232e] text-[11px] font-bold uppercase tracking-wider text-steam-subtext hover:text-white flex items-center justify-between cursor-pointer border-t border-b border-black/30 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-steam-accent flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-steam-accent flex-shrink-0" />
                      )}
                      {col.id === 'favorites' && <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />}
                      <span className="truncate">{col.name}</span>
                      <span className="text-[10px] text-[#677788] font-normal">({col.games.length})</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenManageCollectionsModal();
                      }}
                      className="p-0.5 text-[#556772] hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100"
                      title="Manage Collection"
                    >
                      <Bookmark className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Collection Games */}
                  {!isCollapsed && (
                    <div className="divide-y divide-steam-border/10 pl-1">
                      {col.games.length === 0 ? (
                        <div className="px-5 py-2 text-[11px] text-steam-subtext italic">
                          No games in this collection.
                        </div>
                      ) : (
                        col.games.map(renderGameRow)
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Uncategorized Collection */}
            {groupedData.uncategorized.length > 0 && (
              <div key="uncategorized" className="mb-0.5">
                <div
                  onClick={() => toggleCollectionCollapse('uncategorized')}
                  className="px-3 py-1 bg-[#141a22] hover:bg-[#1b232e] text-[11px] font-bold uppercase tracking-wider text-steam-subtext hover:text-white flex items-center justify-between cursor-pointer border-t border-b border-black/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {collapsedCollections['uncategorized'] ? (
                      <ChevronRight className="w-3 h-3 text-steam-accent flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-steam-accent flex-shrink-0" />
                    )}
                    <span>Uncategorized</span>
                    <span className="text-[10px] text-[#677788] font-normal">
                      ({groupedData.uncategorized.length})
                    </span>
                  </div>
                </div>

                {!collapsedCollections['uncategorized'] && (
                  <div className="divide-y divide-steam-border/10 pl-1">
                    {groupedData.uncategorized.map(renderGameRow)}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Flat Alphabetical Mode */
          <div className="divide-y divide-steam-border/20">
            {games.map(renderGameRow)}
          </div>
        )}
      </div>
    </aside>
  );
};
