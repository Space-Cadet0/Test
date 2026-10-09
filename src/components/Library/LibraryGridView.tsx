import React, { useState, useRef } from 'react';
import { CanonicalGame } from '../../contracts/game';
import { StorefrontIcon, getStorefrontDisplayName } from '../Common/StorefrontIcon';
import {
  Gamepad2,
  Clock,
  ThumbsUp,
  ArrowRight,
  Layers,
  CheckCircle2,
  Cloud,
  ArrowLeft,
} from 'lucide-react';

interface LibraryGridViewProps {
  games: CanonicalGame[];
  onSelectGame: (game: CanonicalGame) => void;
  searchQuery?: string;
  title?: string;
  subtitle?: string;
  groupIcon?: React.ReactNode;
  onClearGroupFilter?: () => void;
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({
  games,
  onSelectGame,
  searchQuery,
  title,
  subtitle,
  groupIcon,
  onClearGroupFilter,
}) => {
  const [hoveredGame, setHoveredGame] = useState<CanonicalGame | null>(null);
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number; align: 'left' | 'right' }>({
    x: 0,
    y: 0,
    align: 'left',
  });
  const [sortBy, setSortBy] = useState<'alphabetical' | 'playtime' | 'recent'>('alphabetical');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sorting
  const sortedGames = [...games].sort((a, b) => {
    if (sortBy === 'playtime') {
      const ptA = a.platforms.reduce((acc, p) => acc + (p.playtimeMinutes || 0), 0);
      const ptB = b.platforms.reduce((acc, p) => acc + (p.playtimeMinutes || 0), 0);
      return ptB - ptA;
    }
    if (sortBy === 'recent') {
      const lpA = Math.max(
        0,
        ...a.platforms.map((p) => (typeof p.lastPlayed === 'number' ? p.lastPlayed : 0))
      );
      const lpB = Math.max(
        0,
        ...b.platforms.map((p) => (typeof p.lastPlayed === 'number' ? p.lastPlayed : 0))
      );
      return lpB - lpA;
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
  });

  const handleMouseEnter = (game: CanonicalGame, e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const alignRight = rect.right + 340 > window.innerWidth;

    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewPos({
        x: alignRight ? rect.left - 330 : rect.right + 12,
        y: Math.max(80, Math.min(rect.top - 20, window.innerHeight - 440)),
        align: alignRight ? 'right' : 'left',
      });
      setHoveredGame(game);
    }, 280);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredGame(null);
    }, 150);
  };

  const formatPlaytime = (game: CanonicalGame) => {
    const mins = game.platforms.reduce((acc, p) => acc + (p.playtimeMinutes || 0), 0);
    if (mins <= 0) return null;
    if (mins < 60) return `${mins} mins`;
    const hrs = (mins / 60).toFixed(1);
    return `${hrs.endsWith('.0') ? parseInt(hrs, 10) : hrs} hrs`;
  };

  return (
    <div className="w-full min-h-full bg-[#0e141b] text-steam-text pb-28 overflow-y-auto relative select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-0 right-0 h-96 opacity-10 pointer-events-none bg-gradient-to-b from-steam-accent/40 via-transparent to-transparent filter blur-3xl" />

      <div className="max-w-[1600px] mx-auto px-6 pt-6 space-y-6 relative">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-steam-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-steam-accent/15 border border-steam-accent/30 text-steam-accent shadow-sm flex items-center justify-center">
              {groupIcon || <Gamepad2 className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  {title || 'All Games'}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2838] border border-steam-border text-steam-accent font-semibold">
                    {games.length}
                  </span>
                </h1>
                {onClearGroupFilter && (
                  <button
                    onClick={onClearGroupFilter}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-steam-accent hover:text-white bg-[#16202d] hover:bg-[#202f42] border border-steam-border rounded transition-colors group cursor-pointer"
                    title="Return to All Games library grid"
                  >
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    <span>All Games</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-steam-subtext mt-0.5">
                {subtitle || 'Browse your universal game collection across all connected storefronts'}
              </p>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-steam-subtext font-medium">Sort by:</span>
            <div className="flex items-center rounded border border-steam-border bg-[#16202d] p-0.5">
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  sortBy === 'alphabetical'
                    ? 'bg-steam-accent text-black shadow-sm'
                    : 'text-steam-text hover:text-white'
                }`}
              >
                Alphabetical
              </button>
              <button
                onClick={() => setSortBy('playtime')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  sortBy === 'playtime'
                    ? 'bg-steam-accent text-black shadow-sm'
                    : 'text-steam-text hover:text-white'
                }`}
              >
                Play Time
              </button>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  sortBy === 'recent'
                    ? 'bg-steam-accent text-black shadow-sm'
                    : 'text-steam-text hover:text-white'
                }`}
              >
                Recently Played
              </button>
            </div>
          </div>
        </div>

        {/* Search status notice if filtering */}
        {searchQuery && (
          <div className="text-xs text-steam-subtext flex items-center gap-2">
            <span>Showing results for</span>
            <span className="text-white font-semibold bg-white/10 px-2 py-0.5 rounded">
              "{searchQuery}"
            </span>
            <span>({games.length} matching)</span>
          </div>
        )}

        {/* Empty State */}
        {games.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-[#16202d]/50 rounded-lg border border-steam-border/60 p-8">
            <Layers className="w-12 h-12 text-steam-subtext/60" />
            <h3 className="text-base font-bold text-white">
              {title ? `No games in "${title}"` : 'No games found'}
            </h3>
            <p className="text-xs text-steam-subtext max-w-sm">
              {title
                ? `You have not assigned any titles to the "${title}" collection yet. You can add games from the sidebar or any game detail page.`
                : 'No titles match your current filter or search criteria. Try clearing search or switching platforms.'}
            </p>
            {onClearGroupFilter && (
              <button
                onClick={onClearGroupFilter}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-steam-accent text-black font-semibold text-xs hover:brightness-110 transition-all shadow"
              >
                <span>View All Games</span>
              </button>
            )}
          </div>
        )}

        {/* Game Covers Grid (Aspect Ratio ~2:3 Portrait Posters) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
          {sortedGames.map((game) => {
            const isInstalled = game.platforms.some((p) => p.installed);
            const coverArtUrl = game.steamAppId
              ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.steamAppId}/library_600x900_2x.jpg`
              : game.headerImage;

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                onMouseEnter={(e) => handleMouseEnter(game, e)}
                onMouseLeave={handleMouseLeave}
                className="group relative flex flex-col rounded-md overflow-hidden bg-[#16202d] border border-steam-border/70 hover:border-steam-accent transition-all duration-200 cursor-pointer shadow-md hover:shadow-2xl hover:scale-[1.03] active:scale-[0.99]"
              >
                {/* 2:3 Portrait Capsule Viewport */}
                <div className="relative aspect-[2/3] w-full bg-black/60 overflow-hidden">
                  <img
                    src={coverArtUrl}
                    alt={game.title}
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to landscape header if portrait 600x900 fails
                      if (e.currentTarget.src !== game.headerImage) {
                        e.currentTarget.src = game.headerImage;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:brightness-105 transition-all duration-300"
                  />

                  {/* Gradient bottom shadow to ensure overlays pop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                  {/* Top Header: Installed status badge if installed */}
                  {isInstalled && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>Ready</span>
                    </div>
                  )}

                  {/* Overlayed Bottom-Right: Storefront Icons Game is Owned On */}
                  <div
                    className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/85 backdrop-blur-md px-2 py-1 rounded border border-white/20 shadow-lg pointer-events-none group-hover:border-steam-accent/60 transition-colors"
                    title={`Owned on: ${game.platforms.map((p) => getStorefrontDisplayName(p.platformId)).join(', ')}`}
                  >
                    {game.platforms.map((p) => (
                      <StorefrontIcon
                        key={p.platformId}
                        storefrontId={p.platformId}
                        className="w-3.5 h-3.5 text-white/90 drop-shadow"
                      />
                    ))}
                  </div>

                  {/* Hover Quick Action Indicator */}
                  <div className="absolute inset-0 bg-steam-accent/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Bottom Card Title Info */}
                <div className="p-2.5 bg-[#16202d] flex flex-col justify-between border-t border-steam-border/40 min-h-[46px]">
                  <h3
                    className="text-xs font-semibold text-white/90 group-hover:text-steam-accent truncate transition-colors"
                    title={game.title}
                  >
                    {game.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-steam-subtext mt-0.5">
                    <span>
                      {game.genres.slice(0, 1).join(', ') || 'Game'}
                    </span>
                    {formatPlaytime(game) && (
                      <span className="text-white/80 font-medium">
                        {formatPlaytime(game)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Hover Preview Pane (Steam Popover Style) */}
      {hoveredGame && (
        <div
          style={{
            position: 'fixed',
            left: `${previewPos.x}px`,
            top: `${previewPos.y}px`,
            zIndex: 60,
          }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          onClick={() => onSelectGame(hoveredGame)}
          className="w-80 rounded-lg overflow-hidden bg-[#16202d]/95 backdrop-blur-xl border border-steam-accent/70 shadow-[0_12px_40px_rgba(0,0,0,0.85)] pointer-events-auto cursor-pointer animate-in fade-in zoom-in-95 duration-150 text-steam-text"
        >
          {/* Header Image Banner */}
          <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
            <img
              src={hoveredGame.headerImage}
              alt={hoveredGame.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#16202d] via-transparent to-black/30" />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white drop-shadow truncate">
                {hoveredGame.title}
              </span>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-3.5 space-y-3 text-xs">
            {/* Review Sentiment & Playtime Row */}
            <div className="flex items-center justify-between border-b border-steam-border/40 pb-2">
              {hoveredGame.reviewSummary ? (
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-steam-accent" />
                  <span className="text-steam-accent font-semibold text-[11px]">
                    {hoveredGame.reviewSummary.reviewScoreDesc}
                  </span>
                  <span className="text-steam-subtext text-[10px]">
                    ({hoveredGame.reviewSummary.positivePercent}%)
                  </span>
                </div>
              ) : (
                <span className="text-steam-subtext text-[11px] italic">Verified in Library</span>
              )}

              {formatPlaytime(hoveredGame) ? (
                <div className="flex items-center gap-1 text-white font-medium text-[11px]">
                  <Clock className="w-3 h-3 text-sky-400" />
                  <span>{formatPlaytime(hoveredGame)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sky-300 text-[11px]">
                  <Cloud className="w-3 h-3" />
                  <span>Cloud Library</span>
                </div>
              )}
            </div>

            {/* Synopsis Snippet */}
            {hoveredGame.shortDescription && (
              <p className="text-[11px] text-steam-subtext leading-relaxed line-clamp-3">
                {hoveredGame.shortDescription}
              </p>
            )}

            {/* Owned On Storefronts Row */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-steam-subtext text-[10px] uppercase font-bold tracking-wider">
                Owned on:
              </span>
              <div className="flex items-center gap-1.5">
                {hoveredGame.platforms.map((p) => (
                  <div
                    key={p.platformId}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[10px] text-white"
                  >
                    <StorefrontIcon storefrontId={p.platformId} className="w-3 h-3 text-sky-400" />
                    <span>{getStorefrontDisplayName(p.platformId)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Pills */}
            {hoveredGame.tags && hoveredGame.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {hoveredGame.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] bg-[#223042] text-steam-accent border border-steam-border/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Click to Open Prompt */}
            <div className="pt-2 border-t border-steam-border/40 flex items-center justify-between text-[11px] text-steam-accent font-semibold group">
              <span>View 1:1 Steam Store Page</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
