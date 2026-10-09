import React from 'react';
import { CanonicalGame } from '../../contracts/game';
import { STOREFRONT_REGISTRY, StorefrontId } from '../../contracts/platform';
import {
  Gamepad2,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  Layers,
  ChevronDown
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
}) => {
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
            placeholder="Search by name, tag, dev..."
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#0b0e13] text-white placeholder-steam-subtext rounded border border-steam-border/80 focus:border-steam-accent focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-steam-subtext hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filters Row */}
        <div className="flex items-center justify-between text-xs">
          {/* Platform selector dropdown / button */}
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

      {/* Category Section Header */}
      <div className="px-3 py-1.5 bg-[#171c24] border-b border-steam-border/40 flex items-center justify-between text-[11px] text-steam-subtext uppercase tracking-wider font-semibold">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-steam-accent" />
          All Games ({games.length})
        </span>

        <button
          onClick={onOpenImportModal}
          className="text-steam-accent hover:text-white flex items-center gap-1 normal-case font-normal text-[11px] hover:underline"
          title="Scrape and import a new game"
        >
          <Sparkles className="w-3 h-3" />
          <span>+ Add Steam Game</span>
        </button>
      </div>

      {/* Games List (Steam Library Scrollable Column) */}
      <div className="flex-1 overflow-y-auto divide-y divide-steam-border/20 py-1">
        {games.length === 0 ? (
          <div className="p-6 text-center text-xs text-steam-subtext space-y-2">
            <Gamepad2 className="w-8 h-8 text-steam-subtext/30 mx-auto" />
            <p>No titles found.</p>
          </div>
        ) : (
          games.map((game) => {
            const isSelected = game.id === selectedGameId;
            const isInstalled = game.platforms.some((p) => p.installed);

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`relative px-3 py-2 flex items-center gap-2.5 cursor-pointer transition-all group ${
                  isSelected
                    ? 'bg-[#223547] text-white border-l-4 border-steam-accent shadow-inner'
                    : 'text-steam-text hover:bg-[#1a212b] hover:text-white border-l-4 border-transparent'
                }`}
              >
                {/* Small Thumbnail Icon */}
                <div className="w-8 h-8 rounded bg-black/60 overflow-hidden flex-shrink-0 border border-steam-border/40 group-hover:border-steam-accent/50">
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
                      className={`text-xs font-semibold truncate ${
                        isInstalled ? 'text-white' : 'text-[#8f98a0] group-hover:text-white'
                      }`}
                    >
                      {game.title}
                    </span>
                    {isInstalled && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Installed" />
                    )}
                  </div>

                  {/* Platforms mini badges */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {game.platforms.map((p) => (
                      <span
                        key={p.platformId}
                        className="text-[9px] uppercase px-1 rounded bg-[#10151d] text-steam-subtext border border-steam-border/30 font-medium"
                      >
                        {p.platformId === 'steam' ? 'STM' : p.platformId === 'gog' ? 'GOG' : p.platformId === 'epic' ? 'EGS' : p.platformId === 'xbox' ? 'XBX' : p.platformId.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-2.5 bg-[#12161e] border-t border-steam-border/60 text-[11px] text-steam-subtext flex items-center justify-between">
        <span>SpaceCadet's Vault</span>
        <span className="text-emerald-400 font-mono text-[10px]">SYNCED</span>
      </div>
    </aside>
  );
};
