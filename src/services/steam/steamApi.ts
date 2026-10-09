import axios from 'axios';
import {
  SteamEnrichedMetadata,
  SteamReviewSummary,
  SteamScreenshot,
  SteamMovie,
  SteamCategory,
} from '../../contracts/steam';

export function getSteamCategoryIconUrl(id: number): string {
  const map: Record<number, string> = {
    2: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_singlePlayer.png',
    1: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_multiPlayer.png',
    49: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_multiPlayer.png',
    36: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_multiPlayer.png',
    9: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_coop.png',
    38: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_coop.png',
    27: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_multiPlayer.png',
    22: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_achievements.png',
    28: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_controller.png',
    18: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_controller.png',
    35: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_cart.png',
    57: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_controller.png',
    61: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_hdr.png',
    62: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_familysharing.png',
    23: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_cloud.png',
    29: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_cards.png',
  };
  return map[id] || 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_singlePlayer.png';
}

import steamEnrichedCache from '../storage/steamEnrichedCache.json';

export class SteamApiService {
  private cache = new Map<number, SteamEnrichedMetadata>();
  private rateLimitedUntil = 0;

  isStoreRateLimited(): boolean {
    return Date.now() < this.rateLimitedUntil;
  }

  getCooldownRemainingSeconds(): number {
    return Math.max(0, Math.ceil((this.rateLimitedUntil - Date.now()) / 1000));
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/steam-store';
    }
    return 'https://store.steampowered.com';
  }

  async fetchGameMetadata(appId: number): Promise<SteamEnrichedMetadata | null> {
    if (this.cache.has(appId)) {
      return this.cache.get(appId)!;
    }

    const preCached = (steamEnrichedCache as Record<string, any>)[String(appId)];
    if (preCached && preCached.aboutTheGame) {
      const enriched: SteamEnrichedMetadata = {
        ...preCached,
        categories: (preCached.categories || []).map((c: any) => ({
          ...c,
          icon: getSteamCategoryIconUrl(c.id),
        })),
      };
      this.cache.set(appId, enriched);
      return enriched;
    }

    if (this.isStoreRateLimited()) {
      return null;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const [detailsRes, reviewsRes] = await Promise.all([
        axios.get(`${baseUrl}/api/appdetails?appids=${appId}&l=english`, { timeout: 8000 }),
        axios.get(`${baseUrl}/appreviews/${appId}?json=1&language=all`, { timeout: 6000 }).catch(() => null),
      ]);

      const appData = detailsRes.data?.[appId];
      if (!appData || !appData.success || !appData.data) {
        return null;
      }

      const data = appData.data;

      // Extract screenshots
      const screenshots: SteamScreenshot[] = (data.screenshots || []).map((s: any) => ({
        id: s.id,
        pathThumbnail: s.path_thumbnail,
        pathFull: s.path_full,
      }));

      // Extract movies / trailers
      const movies: SteamMovie[] = (data.movies || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        thumbnail: m.thumbnail,
        webm: {
          480: m.webm?.['480'] || '',
          max: m.webm?.max || '',
        },
        mp4: {
          480: m.mp4?.['480'] || m.dash_h264 || '',
          max: m.mp4?.max || m.hls_h264 || '',
        },
      }));

      // Extract review summary
      let reviewSummary: SteamReviewSummary = {
        reviewScore: 0,
        reviewScoreDesc: 'No User Reviews',
        totalPositive: 0,
        totalNegative: 0,
        totalReviews: 0,
        positivePercent: 0,
      };

      if (reviewsRes?.data?.query_summary) {
        const qs = reviewsRes.data.query_summary;
        const total = qs.total_reviews || 0;
        const positive = qs.total_positive || 0;
        const negative = qs.total_negative || 0;
        const percent = total > 0 ? Math.round((positive / total) * 100) : 0;

        reviewSummary = {
          reviewScore: qs.review_score || 0,
          reviewScoreDesc: qs.review_score_desc || (total > 0 ? `${percent}% Positive` : 'No User Reviews'),
          totalPositive: positive,
          totalNegative: negative,
          totalReviews: total,
          positivePercent: percent,
        };
      }

      // Extract categories (features)
      const categories: SteamCategory[] = (data.categories || []).map((c: any) => ({
        id: c.id,
        description: c.description,
        icon: getSteamCategoryIconUrl(c.id),
      }));

      // Extract genres & tags
      const genres: string[] = (data.genres || []).map((g: any) => g.description);
      const tags: string[] = (data.categories || []).map((c: any) => c.description).slice(0, 10);

      const metadata: SteamEnrichedMetadata = {
        appId,
        name: data.name,
        shortDescription: data.short_description || '',
        detailedDescription: data.detailed_description || '',
        aboutTheGame: data.about_the_game || '',
        headerImage: data.header_image || '',
        capsuleImage: data.capsule_image,
        developers: data.developers || [],
        publishers: data.publishers || [],
        releaseDate: data.release_date?.date || (data.release_date?.coming_soon ? 'Coming Soon' : 'TBA'),
        genres,
        tags,
        categories,
        screenshots,
        movies,
        systemRequirements: {
          minimum: typeof data.pc_requirements?.minimum === 'string' ? data.pc_requirements.minimum : undefined,
          recommended: typeof data.pc_requirements?.recommended === 'string' ? data.pc_requirements.recommended : undefined,
        },
        reviewSummary,
        supportedLanguages: data.supported_languages,
        legalNotice: data.legal_notice,
        drmNotice: data.drm_notice,
        controllerSupport: data.controller_support,
        pcRequirementsHtml: data.pc_requirements?.minimum || undefined,
      };

      this.cache.set(appId, metadata);
      return metadata;
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.response?.status === 429) {
        // Akamai CDN edge rate limit: pause storefront web requests for 15 minutes to let the cooldown reset cleanly
        this.rateLimitedUntil = Date.now() + 15 * 60 * 1000;
        console.warn(`[Steam API] Akamai edge cooldown encountered (${err.response.status}). Pausing web requests to store.steampowered.com for 15 minutes to allow IP cooldown to clear.`);
      } else {
        console.warn(`Failed to fetch Steam metadata for appId ${appId}:`, err);
      }
      return null;
    }
  }

  async searchAppId(term: string): Promise<number | null> {
    if (this.isStoreRateLimited()) return null;
    try {
      const baseUrl = this.getBaseUrl();
      const res = await axios.get(`${baseUrl}/api/storesearch/?term=${encodeURIComponent(term)}&l=english&cc=US`);
      if (res.data?.items?.length > 0) {
        return res.data.items[0].id;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const steamApi = new SteamApiService();
