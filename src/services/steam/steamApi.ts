import axios from 'axios';
import { SteamEnrichedMetadata, SteamReviewSummary, SteamScreenshot, SteamMovie } from '../../contracts/steam';

export class SteamApiService {
  private cache = new Map<number, SteamEnrichedMetadata>();

  private getBaseUrl(): string {
    // In browser/Vite dev, use the proxy route to avoid CORS.
    // In production or Node/Electron, direct URL can be used.
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/steam-store';
    }
    return 'https://store.steampowered.com';
  }

  async fetchGameMetadata(appId: number): Promise<SteamEnrichedMetadata | null> {
    if (this.cache.has(appId)) {
      return this.cache.get(appId)!;
    }

    try {
      const baseUrl = this.getBaseUrl();
      const [detailsRes, reviewsRes] = await Promise.all([
        axios.get(`${baseUrl}/api/appdetails?appids=${appId}&l=english`, { timeout: 8000 }),
        axios.get(`${baseUrl}/appreviews/${appId}?json=1&language=all`, { timeout: 6000 }).catch(() => null)
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
        screenshots,
        movies,
        systemRequirements: {
          minimum: typeof data.pc_requirements?.minimum === 'string' ? data.pc_requirements.minimum : undefined,
          recommended: typeof data.pc_requirements?.recommended === 'string' ? data.pc_requirements.recommended : undefined,
        },
        reviewSummary,
        supportedLanguages: data.supported_languages,
        pcRequirementsHtml: data.pc_requirements?.minimum || undefined,
      };

      this.cache.set(appId, metadata);
      return metadata;
    } catch (err) {
      console.warn(`Failed to fetch Steam metadata for appId ${appId}:`, err);
      return null;
    }
  }

  async searchAppId(term: string): Promise<number | null> {
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
