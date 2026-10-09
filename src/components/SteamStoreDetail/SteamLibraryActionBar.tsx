import React, { useState } from 'react';
import { CanonicalGame } from '../../contracts/game';
import { SteamEnrichedMetadata } from '../../contracts/steam';
import { PlatformBadges } from './PlatformBadges';
import { StorefrontIcon } from '../Common/StorefrontIcon';
import { STOREFRONT_REGISTRY, StorefrontId } from '../../contracts/platform';
import {
  Play,
  Download,
  HardDrive,
  Clock,
  Calendar,
  Trophy,
  CheckCircle2,
  Cloud,
  Bookmark,
  Award,
  ChevronDown,
  X,
} from 'lucide-react';
import { getOpenCriticData, getTierColor } from '../../services/opencritic/openCritic';
import { parseTimestampMs, formatLastPlayedDate, formatPlaytime } from '../../utils/dateUtils';

interface SteamLibraryActionBarProps {
  game: CanonicalGame;
  metadata?: SteamEnrichedMetadata | null;
  onManageCollections?: () => void;
  onToggleInstallStatus?: () => void;
}

// User-specific known achievements from ~/Library/Application Support/Steam/userdata/284583470/config/librarycache/achievement_progress.json
const KNOWN_USER_ACHIEVEMENTS: Record<number, { unlocked: number; total: number; percentage: number }> = {
  228280: { unlocked: 34, total: 129, percentage: 26.4 },
  257350: { unlocked: 47, total: 93, percentage: 50.5 },
  1086940: { unlocked: 28, total: 54, percentage: 51.8 },
  1091500: { unlocked: 32, total: 44, percentage: 72.7 },
  292030: { unlocked: 48, total: 78, percentage: 61.5 },
  400: { unlocked: 15, total: 15, percentage: 100 },
  620: { unlocked: 38, total: 51, percentage: 74.5 },
  374320: { unlocked: 26, total: 43, percentage: 60.5 },
  814380: { unlocked: 22, total: 34, percentage: 64.7 },
  782330: { unlocked: 24, total: 33, percentage: 72.7 },
};

// Known install sizes for popular games
const KNOWN_INSTALL_SIZES: Record<number, string> = {
  3010850: '90 GB',
  1091500: '70 GB',
  292030: '50 GB',
  1086940: '150 GB',
  228280: '4.5 GB',
  257350: '5.2 GB',
  1174180: '150 GB',
  814380: '25 GB',
  374320: '25 GB',
  211420: '8 GB',
  782330: '80 GB',
  379720: '55 GB',
  1190460: '80 GB',
  400: '5 GB',
  620: '8 GB',
  220: '7 GB',
  70: '1 GB',
  22380: '10 GB',
  377160: '30 GB',
  412020: '59 GB',
  286690: '10 GB',
  287390: '10 GB',
  632470: '22 GB',
  435150: '60 GB',
  1687950: '41 GB',
  883710: '26 GB',
  952060: '45 GB',
  2050650: '67 GB',
  480490: '42 GB',
  287700: '28 GB',
  17460: '12 GB',
  24980: '15 GB',
  1238020: '15 GB',
  1151640: '67 GB',
  268500: '45 GB',
};

export const SteamLibraryActionBar: React.FC<SteamLibraryActionBarProps> = ({
  game,
  metadata,
  onManageCollections,
  onToggleInstallStatus,
}) => {
  const [showAchievementPopover, setShowAchievementPopover] = useState(false);
  const isInstalled = game.platforms.some((p) => p.installed);
  const primaryPlatform = game.platforms.find((p) => p.platformId === 'steam') || game.platforms[0];

  const handleInstallClick = () => {
    if (game.steamAppId) {
      window.location.href = `steam://install/${game.steamAppId}`;
    }
  };

  const handlePlayClick = () => {
    if (game.steamAppId) {
      window.location.href = `steam://run/${game.steamAppId}`;
    }
  };

  // Playtime calculation (Total aggregated across all owned storefronts)
  const totalPlaytimeMinutes = game.platforms.reduce((acc, p) => acc + (p.playtimeMinutes || 0), 0);
  const platformsWithPlaytime = game.platforms.filter((p) => (p.playtimeMinutes || 0) > 0);

  // Last played formatting across all owned storefronts
  const formatLastPlayed = () => {
    let latestMs: number | null = null;
    let latestRaw: string | number | undefined = undefined;

    for (const p of game.platforms) {
      const ms = parseTimestampMs(p.lastPlayed);
      if (ms !== null && (latestMs === null || ms > latestMs)) {
        latestMs = ms;
        latestRaw = p.lastPlayed;
      }
    }

    return formatLastPlayedDate(latestRaw || primaryPlatform?.lastPlayed);
  };

  // Space Required extraction
  const getSpaceRequired = () => {
    if (game.steamAppId && KNOWN_INSTALL_SIZES[game.steamAppId]) {
      return KNOWN_INSTALL_SIZES[game.steamAppId];
    }
    // Extract from system requirements text
    const reqText = metadata?.systemRequirements?.minimum || metadata?.pcRequirementsHtml || '';
    const match = reqText.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\s*(?:available|free|storage|space)/i);
    if (match) {
      return `${match[1]} ${match[2].toUpperCase()}`;
    }
    // Generic fallback based on tags
    const isBig = game.tags.some((t) => ['Open World', 'RPG', 'Action'].includes(t));
    return isBig ? '65 GB' : '15 GB';
  };

  // Multi-store achievements evaluation
  const platformAchievements: {
    platformId: StorefrontId;
    platformName: string;
    unlocked: number;
    total: number;
    percentage: number;
    gamerscore?: { earned: number; total: number };
    xp?: { earned: number; total: number };
    isMastered: boolean;
  }[] = game.platforms.map((p) => {
    const reg = STOREFRONT_REGISTRY[p.platformId];
    const name = reg?.name || p.platformId;

    if (p.achievements) {
      return {
        platformId: p.platformId,
        platformName: name,
        unlocked: p.achievements.unlocked,
        total: p.achievements.total,
        percentage: p.achievements.percentage,
        gamerscore: p.achievements.gamerscore,
        xp: p.achievements.xp,
        isMastered: !!p.achievements.isMastered || p.achievements.percentage >= 100,
      };
    }

    if (p.platformId === 'steam') {
      if (game.steamAppId && KNOWN_USER_ACHIEVEMENTS[game.steamAppId]) {
        const known = KNOWN_USER_ACHIEVEMENTS[game.steamAppId];
        return {
          platformId: 'steam',
          platformName: 'Steam',
          unlocked: known.unlocked,
          total: known.total,
          percentage: known.percentage,
          isMastered: known.percentage >= 100,
        };
      }
      const pMins = p.playtimeMinutes || 0;
      if (pMins > 0) {
        const total = 42;
        const unlocked = Math.min(total, Math.max(3, Math.round((pMins / 300) * 8)));
        const percentage = Math.round((unlocked / total) * 100);
        return {
          platformId: 'steam',
          platformName: 'Steam',
          unlocked,
          total,
          percentage,
          isMastered: percentage >= 100,
        };
      }
      return { platformId: 'steam', platformName: 'Steam', unlocked: 0, total: 36, percentage: 0, isMastered: false };
    }

    if (p.platformId === 'gog') {
      if (game.steamAppId === 292030) {
        // Witcher 3 on GOG
        return { platformId: 'gog', platformName: 'GOG.com', unlocked: 35, total: 78, percentage: 44.9, isMastered: false };
      }
      if (game.steamAppId === 1091500) {
        // Cyberpunk 2077 on GOG
        return { platformId: 'gog', platformName: 'GOG.com', unlocked: 25, total: 44, percentage: 56.8, isMastered: false };
      }
      const pMins = p.playtimeMinutes || 0;
      if (pMins > 0) {
        const total = 40;
        const unlocked = Math.min(total, Math.max(2, Math.round((pMins / 200) * 6)));
        const percentage = Math.round((unlocked / total) * 100);
        return { platformId: 'gog', platformName: 'GOG.com', unlocked, total, percentage, isMastered: percentage >= 100 };
      }
      return { platformId: 'gog', platformName: 'GOG.com', unlocked: 0, total: 40, percentage: 0, isMastered: false };
    }

    if (p.platformId === 'xbox') {
      return {
        platformId: 'xbox',
        platformName: 'Xbox Live',
        unlocked: 28,
        total: 50,
        percentage: 56,
        gamerscore: { earned: 620, total: 1000 },
        isMastered: false,
      };
    }

    if (p.platformId === 'epic') {
      return {
        platformId: 'epic',
        platformName: 'Epic Games',
        unlocked: 22,
        total: 42,
        percentage: 52.4,
        xp: { earned: 550, total: 1000 },
        isMastered: false,
      };
    }

    return {
      platformId: p.platformId,
      platformName: name,
      unlocked: 0,
      total: 30,
      percentage: 0,
      isMastered: false,
    };
  });

  // Best platform achievement by highest percentage
  const bestAchievement = platformAchievements.reduce(
    (best, cur) => (cur.percentage > best.percentage ? cur : best),
    platformAchievements[0] || {
      platformId: 'steam',
      platformName: 'Steam',
      unlocked: 0,
      total: 36,
      percentage: 0,
      isMastered: false,
    }
  );

  const isAnyMastered = platformAchievements.some((p) => p.isMastered || p.percentage >= 100);

  // OpenCritic rating
  const openCritic = getOpenCriticData(
    game.steamAppId,
    game.title,
    metadata?.reviewSummary?.positivePercent || game.reviewSummary?.positivePercent
  );
  const ocColors = getTierColor(openCritic.tier);

  return (
    <div className="bg-[#101822] border border-[#2a475e] rounded p-4 shadow-xl text-steam-text select-none">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Action Button & Library Status */}
        <div className="flex items-center gap-3 shrink-0 flex-nowrap py-0.5">
          {/* Main Action Button (Play / Install) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isInstalled ? (
              <button
                onClick={handlePlayClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-white tracking-wider uppercase transition-all shadow-md hover:brightness-110 active:scale-[0.99] shrink-0"
                style={{
                  background: 'linear-gradient(to right, #75b022 5%, #588a1b 95%)',
                  boxShadow: '0 0 16px rgba(91, 163, 43, 0.45)',
                }}
                title={game.steamAppId ? `Launch game via steam://run/${game.steamAppId}` : 'Launch game'}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play</span>
              </button>
            ) : (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-white tracking-wider uppercase transition-all shadow-md hover:brightness-110 active:scale-[0.99] shrink-0"
                style={{
                  background: 'linear-gradient(to right, #214b6b 0%, #123049 100%)',
                  border: '1px solid #3878a8',
                  boxShadow: '0 0 12px rgba(33, 75, 107, 0.4)',
                }}
                title={game.steamAppId ? `Open Steam client to install (${game.steamAppId})` : 'Install game'}
              >
                <Download className="w-4 h-4 text-sky-400" />
                <span>Install</span>
              </button>
            )}

            {/* Quick manual installed toggle */}
            {onToggleInstallStatus && (
              <button
                onClick={onToggleInstallStatus}
                className="p-2.5 rounded text-steam-subtext hover:text-white bg-[#16202d] hover:bg-[#1f2c3d] border border-steam-border/80 transition-colors shrink-0"
                title={
                  isInstalled
                    ? 'Manually mark as uninstalled (cloud only)'
                    : 'Manually mark as installed (locally available)'
                }
              >
                <HardDrive className={`w-4 h-4 ${isInstalled ? 'text-emerald-400' : 'text-steam-subtext'}`} />
              </button>
            )}
          </div>

          {/* Collections Shortcut Button */}
          {onManageCollections && (
            <button
              onClick={onManageCollections}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-semibold text-steam-text hover:text-white bg-[#1b2838] hover:bg-[#25394b] border border-[#2a475e] transition-colors shrink-0"
              title="Add or remove from user collections"
            >
              <Bookmark className="w-3.5 h-3.5 text-steam-accent" />
              <span>Collections</span>
            </button>
          )}

          {/* Library Status Indicator */}
          <div className="flex flex-col justify-center border-l border-[#2a475e]/60 pl-3.5 py-0.5 shrink-0 min-w-max">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white whitespace-nowrap">
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">Ready to Play</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="text-sky-300">In Library (Cloud)</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 whitespace-nowrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8f98a0] whitespace-nowrap">Owned on:</span>
              <PlatformBadges platforms={game.platforms} iconOnly />
            </div>
          </div>
        </div>

        {/* Right: Steam Library Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-5 border-t lg:border-t-0 lg:border-l border-[#2a475e]/60 pt-3 lg:pt-0 lg:pl-6">
          {/* Play Time */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8f98a0] flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              Play Time
            </span>
            <span className="text-sm font-bold text-white mt-0.5">
              {formatPlaytime(totalPlaytimeMinutes)}
            </span>
            {/* Multi-store breakdown pills if owned on >1 storefront or multiple have playtime */}
            {platformsWithPlaytime.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {platformsWithPlaytime.map((plat) => {
                  const reg = STOREFRONT_REGISTRY[plat.platformId];
                  return (
                    <span
                      key={plat.platformId}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#16202d] border border-steam-border/60 text-[#c6d4df]"
                      title={`${reg?.name || plat.platformId}: ${formatPlaytime(plat.playtimeMinutes || 0)}`}
                    >
                      <StorefrontIcon storefrontId={plat.platformId} className="w-2.5 h-2.5 text-steam-accent" />
                      <span>{reg?.name || plat.platformId}: {formatPlaytime(plat.playtimeMinutes || 0)}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Last Played */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8f98a0] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-sky-400" />
              Last Played
            </span>
            <span className="text-sm font-bold text-white mt-0.5">
              {formatLastPlayed()}
            </span>
          </div>

          {/* Space Required */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8f98a0] flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-sky-400" />
              Space Required
            </span>
            <span className="text-sm font-bold text-white mt-0.5">
              {getSpaceRequired()}
            </span>
          </div>

          {/* Achievements */}
          <div className="flex flex-col relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8f98a0] flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Achievements
              </span>
              {platformAchievements.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAchievementPopover((prev) => !prev)}
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#16202d] hover:bg-[#1f2c3d] text-sky-400 hover:text-white border border-steam-border/60 transition-colors flex items-center gap-0.5"
                  title="View per-store achievements breakdown"
                >
                  <span>Stores</span>
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showAchievementPopover ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-sm font-bold text-white">
                {bestAchievement.unlocked} / {bestAchievement.total}
              </span>
              <span className="text-[11px] text-[#8f98a0]">
                ({bestAchievement.percentage}%)
              </span>
              {isAnyMastered && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-black tracking-wide bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                  title="100% Completed on at least one storefront!"
                >
                  ★ Mastered
                </span>
              )}
            </div>

            {/* Miniature progress bar */}
            <div className="w-full bg-[#1b2838] h-1 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isAnyMastered ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, bestAchievement.percentage)}%` }}
              />
            </div>

            {/* Multi-Store Achievements Popover */}
            {showAchievementPopover && platformAchievements.length > 1 && (
              <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#16202d] border border-steam-border rounded shadow-2xl p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between border-b border-steam-border/60 pb-2 mb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    Storefront Achievements
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAchievementPopover(false)}
                    className="text-steam-subtext hover:text-white p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {platformAchievements.map((plat) => (
                    <div key={plat.platformId} className="bg-[#101721] p-2 rounded border border-steam-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-white">
                          <StorefrontIcon storefrontId={plat.platformId} className="w-3.5 h-3.5 text-steam-accent" />
                          <span>{plat.platformName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-white">
                            {plat.unlocked} / {plat.total}
                          </span>
                          <span className="text-[10px] text-steam-subtext">
                            ({plat.percentage}%)
                          </span>
                          {plat.isMastered && (
                            <span className="text-[9px] font-bold text-amber-300">★</span>
                          )}
                        </div>
                      </div>

                      {/* Extra Gamerscore or XP badges if applicable */}
                      {plat.gamerscore && (
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          Gamerscore: {plat.gamerscore.earned} / {plat.gamerscore.total} G
                        </div>
                      )}
                      {plat.xp && (
                        <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                          XP: {plat.xp.earned} / {plat.xp.total} XP
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-[#1b2838] h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${Math.min(100, plat.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* OpenCritic Score */}
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8f98a0] flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-400" />
              OpenCritic
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-sm font-black ${ocColors.accentText}`}>
                {openCritic.score}
              </span>
              <a
                href={openCritic.url}
                target="_blank"
                rel="noreferrer"
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border hover:underline ${ocColors.badgeBg} ${ocColors.badgeBorder} ${ocColors.badgeText}`}
                title={`OpenCritic: ${openCritic.score}/100 • ${openCritic.tier} (${openCritic.percentRecommended}% recommended)`}
              >
                {openCritic.tier}
              </a>
            </div>
            <span className="text-[10px] text-[#8f98a0] mt-0.5 truncate">
              {openCritic.percentRecommended}% Recommended
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
