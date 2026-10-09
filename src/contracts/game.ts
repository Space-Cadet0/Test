import { StorefrontId } from './platform';
import { SteamEnrichedMetadata, SteamReviewSummary } from './steam';

export interface GamePlatformOwnership {
  platformId: StorefrontId;
  platformGameId: string;
  installed: boolean;
  installPath?: string;
  lastPlayed?: string;
  playtimeMinutes?: number;
}

export interface CanonicalGame {
  id: string; // canonical slug / uuid
  title: string;
  sortTitle: string;
  steamAppId?: number;
  platforms: GamePlatformOwnership[];
  headerImage: string;
  capsuleImage?: string;
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
