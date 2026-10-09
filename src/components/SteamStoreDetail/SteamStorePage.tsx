import React, { useEffect, useState } from 'react';
import { CanonicalGame } from '../../contracts/game';
import { SteamEnrichedMetadata } from '../../contracts/steam';
import { steamApi } from '../../services/steam/steamApi';
import { MediaGallery } from './MediaGallery';
import { SteamHeroDetails } from './SteamHeroDetails';
import { SteamLibraryActionBar } from './SteamLibraryActionBar';
import { HowLongToBeatCard } from './HowLongToBeatCard';
import { getHowLongToBeat } from '../../services/hltb/howLongToBeat';
import { SystemRequirements } from './SystemRequirements';
import { PlatformBadges } from './PlatformBadges';
import { SteamLanguagesTable } from './SteamLanguagesTable';
import { SteamFeaturesList } from './SteamFeaturesList';
import { SteamSidebarNotices } from './SteamSidebarNotices';
import {
  ExternalLink,
  Sparkles,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface SteamStorePageProps {
  game: CanonicalGame;
  onBackToLibrary?: () => void;
}

export const SteamStorePage: React.FC<SteamStorePageProps> = ({ game, onBackToLibrary }) => {
  const [metadata, setMetadata] = useState<SteamEnrichedMetadata | null>(
    game.enrichedMetadata || null
  );
  const [isLoading, setIsLoading] = useState(!game.enrichedMetadata && !!game.steamAppId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isCooldown = steamApi.isStoreRateLimited();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (game.steamAppId) {
        if (!game.enrichedMetadata) {
          setIsLoading(true);
        }
        const liveData = await steamApi.fetchGameMetadata(game.steamAppId);
        if (isMounted && liveData) {
          setMetadata(liveData);
        }
        if (isMounted) setIsLoading(false);
      }
    }

    setMetadata(game.enrichedMetadata || null);
    loadData();

    return () => {
      isMounted = false;
    };
  }, [game]);

  const handleRefreshFromSteam = async () => {
    if (!game.steamAppId || steamApi.isStoreRateLimited()) return;
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
  const detailedDescription =
    metadata?.aboutTheGame ||
    metadata?.detailedDescription ||
    game.enrichedMetadata?.aboutTheGame ||
    game.enrichedMetadata?.detailedDescription;

  return (
    <div className="w-full min-h-full bg-[#0e141b] text-steam-text pb-24 overflow-y-auto relative">
      {/* Background Hero Ambient Glow */}
      <div
        className="absolute top-0 left-0 right-0 h-96 opacity-15 pointer-events-none bg-cover bg-center filter blur-3xl"
        style={{
          backgroundImage: `url(${metadata?.headerImage || game.headerImage})`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Navigation Breadcrumb & Actions Bar */}
        <div className="flex items-center justify-between border-b border-steam-border/40 pb-4">
          <div className="flex items-center gap-2 text-xs text-steam-subtext">
            {onBackToLibrary && (
              <button
                onClick={onBackToLibrary}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-steam-accent hover:text-white bg-steam-card hover:bg-steam-border border border-steam-border rounded transition-all mr-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Library
              </button>
            )}
            <span className="hover:text-white cursor-pointer uppercase tracking-wider text-[11px] font-semibold">All Games</span>
            <span>&gt;</span>
            <span className="text-white font-semibold truncate max-w-xs">{game.title}</span>
          </div>

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

        {/* Akamai Edge Cooldown Notice */}
        {isCooldown && (
          <div className="bg-[#1b2838]/90 border border-[#2a475e] text-xs text-steam-subtext rounded px-3.5 py-2.5 flex items-center justify-between shadow-sm">
            <span>
              <strong className="text-steam-accent">Local Library Mode:</strong> Live store web requests paused while Akamai CDN edge cooldown clears. Showing official local assets & artwork.
            </span>
            <span className="text-[11px] text-[#acb2b8] font-mono">Auto-resumes in ~15m</span>
          </div>
        )}

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

        {/* Steam Library Action & Stats Bar (Play Button, Library Status, Play Time, Last Played, Space Required, Achievements) */}
        <SteamLibraryActionBar game={game} metadata={metadata} />

        {/* Main Steam Highlight Showcase (1:1 Steam 2-Column Split: Media Player + Details) */}
        <div className="flex flex-col lg:flex-row gap-4 bg-[#16202d]/80 backdrop-blur rounded border border-steam-border p-4 shadow-xl">
          {/* Left Column: Media Gallery (Trailers + Screenshots) */}
          <div className="flex-1 min-w-0 lg:max-w-[616px]">
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

          {/* Right Column: 1:1 Steam Details (Fixed 324px Width) */}
          <SteamHeroDetails
            headerImage={metadata?.headerImage || game.headerImage}
            title={game.title}
            shortDescription={shortDescription}
            reviewSummary={reviewSummary}
            releaseDate={releaseDate}
            developers={developers}
            publishers={publishers}
            tags={tags}
          />
        </div>

        {/* HowLongToBeat Stats Section */}
        <HowLongToBeatCard hltb={getHowLongToBeat(game.steamAppId, game.genres, game.tags)} gameTitle={game.title} />

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
              ) : shortDescription ? (
                <div className="steam-description-content text-sm space-y-3 leading-relaxed text-[#acb2b8]">
                  <p className="bb_paragraph">{shortDescription}</p>
                </div>
              ) : (
                <div className="text-sm text-steam-subtext italic">
                  Standard Steam catalog title. Full store page overview will synchronize automatically once the CDN cooldown resets.
                </div>
              )}
            </div>

            {/* System Requirements Section */}
            <SystemRequirements requirements={metadata?.systemRequirements} />
          </div>

          {/* Right Sidebar Details (1:1 Steam Right Column) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Features (Specifications & Categories with Official Steam Icons) */}
            <SteamFeaturesList categories={metadata?.categories} title={game.title} />

            {/* Exact 1:1 Languages Matrix Table */}
            <SteamLanguagesTable rawSupportedLanguagesHtml={metadata?.supportedLanguages} />

            {/* Controller Support, Deck Verified, Anti-Cheat, EULA, and Details */}
            <SteamSidebarNotices
              title={game.title}
              steamAppId={game.steamAppId}
              genres={metadata?.genres || game.genres}
              developers={developers}
              publishers={publishers}
              releaseDate={releaseDate}
              legalNotice={metadata?.legalNotice}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
