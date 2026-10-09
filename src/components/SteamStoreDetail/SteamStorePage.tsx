import React, { useEffect, useState } from 'react';
import { CanonicalGame } from '../../contracts/game';
import { SteamEnrichedMetadata } from '../../contracts/steam';
import { steamApi } from '../../services/steam/steamApi';
import { MediaGallery } from './MediaGallery';
import { ReviewSentimentBadge } from './ReviewSentimentBadge';
import { SystemRequirements } from './SystemRequirements';
import { PlatformBadges } from './PlatformBadges';
import {
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Check,
  RefreshCw,
  Globe,
  Tag
} from 'lucide-react';

interface SteamStorePageProps {
  game: CanonicalGame;
  onBackToLibrary: () => void;
}

export const SteamStorePage: React.FC<SteamStorePageProps> = ({ game, onBackToLibrary }) => {
  const [metadata, setMetadata] = useState<SteamEnrichedMetadata | null>(
    game.enrichedMetadata || null
  );
  const [isLoading, setIsLoading] = useState(!game.enrichedMetadata && !!game.steamAppId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (game.steamAppId) {
        setIsLoading(true);
        const liveData = await steamApi.fetchGameMetadata(game.steamAppId);
        if (isMounted && liveData) {
          setMetadata(liveData);
        }
        if (isMounted) setIsLoading(false);
      }
    }

    if (!game.enrichedMetadata && game.steamAppId) {
      loadData();
    } else {
      setMetadata(game.enrichedMetadata || null);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [game]);

  const handleRefreshFromSteam = async () => {
    if (!game.steamAppId) return;
    setIsRefreshing(true);
    const refreshed = await steamApi.fetchGameMetadata(game.steamAppId);
    if (refreshed) {
      setMetadata(refreshed);
    }
    setIsRefreshing(false);
  };

  const screenshots = metadata?.screenshots || [];
  const movies = metadata?.movies || [];
  const reviewSummary = metadata?.reviewSummary || game.reviewSummary;
  const shortDescription = metadata?.shortDescription || game.shortDescription;
  const developers = metadata?.developers || game.developers;
  const publishers = metadata?.publishers || game.publishers;
  const releaseDate = metadata?.releaseDate || game.releaseDate || 'TBA';
  const tags = metadata?.tags || game.tags;
  const detailedDescription = metadata?.detailedDescription || metadata?.aboutTheGame;

  return (
    <div className="w-full min-h-screen bg-[#0e141b] text-steam-text pb-20">
      {/* Background Hero Ambient Glow */}
      <div
        className="absolute top-0 left-0 right-0 h-96 opacity-15 pointer-events-none bg-cover bg-center filter blur-3xl"
        style={{
          backgroundImage: `url(${metadata?.headerImage || game.headerImage})`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between border-b border-steam-border/40 pb-4">
          <button
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-steam-accent hover:text-white bg-steam-card hover:bg-steam-border border border-steam-border rounded transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </button>

          <div className="flex items-center gap-3">
            {game.steamAppId && (
              <button
                onClick={handleRefreshFromSteam}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-steam-text hover:text-white bg-steam-card border border-steam-border rounded transition-colors disabled:opacity-50"
                title="Re-scrape latest media & reviews from Steam"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-steam-accent' : ''}`} />
                <span>{isRefreshing ? 'Syncing Steam...' : 'Sync from Steam'}</span>
              </button>
            )}

            {game.steamAppId && (
              <a
                href={`https://store.steampowered.com/app/${game.steamAppId}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-steam-subtext hover:text-steam-accent bg-steam-card border border-steam-border rounded transition-colors"
              >
                <span>View on Steam</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Game Title & Platform Badges Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow">
              {game.title}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-steam-subtext font-semibold">
                Owned on:
              </span>
              <PlatformBadges platforms={game.platforms} size="md" />
            </div>
          </div>
        </div>

        {/* Main Steam Highlight Showcase (2-Column Split: Media Player + Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#16202d]/80 backdrop-blur rounded border border-steam-border p-4 md:p-6 shadow-2xl">
          {/* Left Column: Media Gallery (Trailers + Screenshots) */}
          <div className="lg:col-span-8 flex flex-col justify-start">
            {isLoading ? (
              <div className="aspect-video w-full bg-black/60 rounded flex flex-col items-center justify-center gap-3 animate-pulse border border-steam-border">
                <Sparkles className="w-8 h-8 text-steam-accent animate-spin" />
                <span className="text-xs text-steam-accent">Loading Steam Media...</span>
              </div>
            ) : (
              <MediaGallery
                screenshots={screenshots}
                movies={movies}
                headerImage={metadata?.headerImage || game.headerImage}
              />
            )}
          </div>

          {/* Right Column: Game Metadata & Summary Card */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Header Capsule Artwork */}
              <div className="rounded overflow-hidden border border-steam-border shadow-md">
                <img
                  src={metadata?.headerImage || game.headerImage}
                  alt={game.title}
                  className="w-full h-auto object-cover"
                />
              </div>

              {/* Short Synopsis Description */}
              <p className="text-xs md:text-sm text-[#c6d4df] leading-relaxed line-clamp-4">
                {shortDescription || 'No description available for this title.'}
              </p>

              {/* Steam Review Sentiment Box */}
              <div className="bg-[#101720]/80 p-3 rounded border border-steam-border/60">
                <div className="text-[11px] uppercase tracking-wider text-steam-subtext font-semibold mb-1">
                  Overall Steam Reviews:
                </div>
                <ReviewSentimentBadge summary={reviewSummary} />
              </div>

              {/* Key Details (Release Date, Developers, Publishers) */}
              <div className="space-y-1.5 text-xs border-t border-steam-border/40 pt-3">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-steam-subtext">Release Date:</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-steam-accent" />
                    {releaseDate}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-steam-subtext">Developer:</span>
                  <span className="text-steam-accent hover:underline font-medium cursor-pointer">
                    {developers.join(', ') || 'Unknown'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-steam-subtext">Publisher:</span>
                  <span className="text-steam-accent hover:underline font-medium cursor-pointer">
                    {publishers.join(', ') || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Popular User-Defined Tags */}
              <div className="space-y-2 border-t border-steam-border/40 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-steam-subtext font-semibold">
                  <Tag className="w-3 h-3 text-steam-accent" />
                  Popular user-defined tags for this product:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[11px] bg-[#67c1f5]/20 hover:bg-[#67c1f5]/30 text-steam-accent rounded border border-steam-accent/30 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Ownership Status Banner */}
            <div className="bg-[#1b2838] p-3 rounded border border-[#2a475e] mt-2">
              <div className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Library Status
              </div>
              <div className="space-y-1 text-[11px] text-steam-subtext">
                {game.platforms.map((p) => (
                  <div key={p.platformId} className="flex items-center justify-between">
                    <span className="capitalize font-medium text-white">{p.platformId}:</span>
                    {p.installed ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Installed locally
                      </span>
                    ) : (
                      <span className="text-steam-subtext">Available in Cloud</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section: Description & Technical Specs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Main Column: "About This Game" */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#16202d] rounded border border-steam-border p-6 shadow-md">
              <h2 className="text-sm font-bold tracking-wider text-steam-accent uppercase border-b border-steam-border/60 pb-3 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-steam-accent" />
                About This Game
              </h2>

              {detailedDescription ? (
                <div
                  className="steam-description-content text-sm space-y-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: detailedDescription }}
                />
              ) : (
                <div className="text-sm text-steam-subtext italic">
                  No extended overview available.
                </div>
              )}
            </div>

            {/* System Requirements Section */}
            <SystemRequirements requirements={metadata?.systemRequirements} />
          </div>

          {/* Right Sidebar Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Languages Panel */}
            {metadata?.supportedLanguages && (
              <div className="bg-[#16202d] rounded border border-steam-border p-4 shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-steam-accent flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Languages
                </h4>
                <div
                  className="text-xs text-steam-subtext leading-relaxed [&_strong]:text-white"
                  dangerouslySetInnerHTML={{ __html: metadata.supportedLanguages }}
                />
              </div>
            )}

            {/* Steam Features / Badges Panel */}
            <div className="bg-[#16202d] rounded border border-steam-border p-4 shadow-sm space-y-3 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-steam-accent">
                Specifications & Features
              </h4>
              <ul className="space-y-2 text-steam-subtext">
                <li className="flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-steam-accent" />
                  Single-player & Co-op
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-steam-accent" />
                  Full Controller Support
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-steam-accent" />
                  Cloud Saves Enabled
                </li>
                <li className="flex items-center gap-2 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-steam-accent" />
                  HDR & High Refresh Rate
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
