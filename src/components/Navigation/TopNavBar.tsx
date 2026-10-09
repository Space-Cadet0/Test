import React from 'react';
import { StorefrontId, STOREFRONT_REGISTRY } from '../../contracts/platform';
import { Search, RefreshCw, Layers, Gamepad, Cloud, ChevronLeft, ChevronRight } from 'lucide-react';

interface TopNavBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedPlatform: StorefrontId | 'all';
  onSelectPlatform: (platform: StorefrontId | 'all') => void;
  installedOnly: boolean;
  onToggleInstalledOnly: () => void;
  totalGamesCount: number;
  filteredCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onHomeClick: () => void;
  onOpenIntegrations: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  backTitle?: string | null;
  canGoForward?: boolean;
  onGoForward?: () => void;
  forwardTitle?: string | null;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onSelectPlatform,
  installedOnly,
  onToggleInstalledOnly,
  totalGamesCount,
  filteredCount,
  isSyncing,
  onTriggerSync,
  onHomeClick,
  onOpenIntegrations,
  canGoBack = false,
  onGoBack,
  backTitle,
  canGoForward = false,
  onGoForward,
  forwardTitle,
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
    <header className="sticky top-0 z-40 bg-[#171a21]/95 backdrop-blur-md border-b border-steam-border shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: History Nav + Brand & Home Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          {/* Back & Forward History Controls */}
          <div className="flex items-center bg-[#10141a] p-0.5 rounded border border-steam-border/80 shadow-inner">
            <button
              type="button"
              onClick={onGoBack}
              disabled={!canGoBack}
              className={`p-1.5 rounded transition-all flex items-center justify-center ${
                canGoBack
                  ? 'text-white hover:text-steam-accent hover:bg-steam-card active:scale-95 cursor-pointer shadow-sm'
                  : 'text-zinc-600 cursor-not-allowed opacity-35'
              }`}
              title={canGoBack ? `Back to ${backTitle || 'previous page'} (Alt + ←)` : 'Back'}
              aria-label="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onGoForward}
              disabled={!canGoForward}
              className={`p-1.5 rounded transition-all flex items-center justify-center ${
                canGoForward
                  ? 'text-white hover:text-steam-accent hover:bg-steam-card active:scale-95 cursor-pointer shadow-sm'
                  : 'text-zinc-600 cursor-not-allowed opacity-35'
              }`}
              title={canGoForward ? `Forward to ${forwardTitle || 'next page'} (Alt + →)` : 'Forward'}
              aria-label="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onHomeClick}
            className="flex items-center gap-2.5 text-white hover:text-steam-accent transition-colors group"
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-steam-border to-steam-dark flex items-center justify-center border border-steam-border group-hover:border-steam-accent shadow-sm">
              <Gamepad className="w-5 h-5 text-steam-accent" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-steam-text to-steam-accent">
                OmniLibrary
              </span>
              <span className="block text-[10px] text-steam-subtext uppercase tracking-widest font-medium">
                Universal Game Browser
              </span>
            </div>
          </button>

          {/* Accounts & Integrations button */}
          <button
            onClick={onOpenIntegrations}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#212b36] hover:bg-steam-border text-steam-text hover:text-white rounded border border-steam-border transition-all shadow-sm group"
            title="Manage connected storefront accounts (Steam, GOG, Epic, Xbox) without local launchers"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Accounts</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </button>

          {/* Sync status button */}
          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#212b36] hover:bg-steam-border text-steam-text hover:text-white rounded border border-steam-border transition-all disabled:opacity-50"
            title="Scan local manifests and sync cloud accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-steam-accent' : 'text-emerald-400'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync All'}</span>
          </button>
        </div>

        {/* Center: Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steam-subtext pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search across all storefronts..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#10141a] text-white placeholder-steam-subtext rounded border border-steam-border/80 focus:border-steam-accent focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-steam-subtext hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Right: Counter & Installed Filter */}
        <div className="flex items-center gap-3 text-xs w-full md:w-auto justify-end">
          <button
            onClick={onToggleInstalledOnly}
            className={`px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              installedOnly
                ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-400 font-semibold'
                : 'bg-steam-card border-steam-border text-steam-subtext hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${installedOnly ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
            Installed Only
          </button>

          <span className="text-steam-subtext flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-steam-accent" />
            <strong className="text-white">{filteredCount}</strong> / {totalGamesCount} Games
          </span>
        </div>
      </div>

      {/* Platform Filter Pills Sub-bar */}
      <div className="bg-[#12161c] border-t border-steam-border/30 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {platforms.map((p) => {
            const isSelected = selectedPlatform === p;
            const meta = p === 'all' ? null : STOREFRONT_REGISTRY[p];
            const name = p === 'all' ? 'All Libraries' : meta?.name || p.toUpperCase();

            return (
              <button
                key={p}
                onClick={() => onSelectPlatform(p)}
                className={`px-3 py-1 rounded text-xs whitespace-nowrap font-medium transition-all ${
                  isSelected
                    ? 'bg-steam-accent text-black font-bold shadow-md shadow-steam-accent/20'
                    : 'bg-[#1b222d] text-steam-text hover:text-white hover:bg-[#253040] border border-steam-border/40'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
