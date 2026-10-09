import { StorefrontId } from './platform';
import { SteamEnrichedMetadata, SteamReviewSummary } from './steam';

export interface StoreAchievementSummary {
  unlocked: number;
  total: number;
  percentage: number;
  gamerscore?: { earned: number; total: number }; // For Xbox (e.g. 850 / 1000 G)
  xp?: { earned: number; total: number };         // For Epic Games (e.g. 600 / 1000 XP)
  isMastered?: boolean;                           // 100% unlocked
  lastUnlockedAt?: string;
}

export interface GamePlatformOwnership {
  platformId: StorefrontId;
  platformGameId: string;
  installed: boolean;
  installPath?: string;
  lastPlayed?: string;
  playtimeMinutes?: number;
  achievements?: StoreAchievementSummary;
}

export interface CanonicalGame {
  id: string; // canonical slug / uuid
  title: string;
  sortTitle: string;
  steamAppId?: number;
  platforms: GamePlatformOwnership[];
  headerImage: string;
  capsuleImage?: string;
  iconUrl?: string;
  shortDescription?: string;
  releaseDate?: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  tags: string[];
  reviewSummary?: SteamReviewSummary;
  enrichedMetadata?: SteamEnrichedMetadata;
  lastSyncedAt?: string;
}
