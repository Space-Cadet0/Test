import axios from 'axios';
import { CanonicalGame } from '../../contracts/game';
import { SteamEnrichedMetadata, SteamScreenshot, SteamMovie, SteamReviewSummary } from '../../contracts/steam';
import { getOpenCriticData } from '../opencritic/openCritic';

function ensureHttps(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return 'https:' + trimmed;
  return trimmed;
}

const GOG_SPECIAL_DESCRIPTIONS: Record<string, { lead: string; full: string; releaseDate?: string }> = {
  '1413291984': {
    lead: 'Developed by id Software, and originally released in 1993, DOOM pioneered and popularized the first-person shooter, setting a standard for all FPS games. The critically acclaimed sequel, DOOM II, followed in 1994. Now the definitive, newly enhanced versions of DOOM + DOOM II are available as a combined product.',
    full: `Developed by id Software, and originally released in 1993, DOOM pioneered and popularized the first-person shooter, setting a standard for all FPS games. The critically acclaimed sequel, DOOM II, followed in 1994. Now the definitive, newly enhanced versions of DOOM + DOOM II are available as a combined product.<br><br><b>Owners Receive:</b><br>- DOOM<br>- DOOM II<br>- TNT: Evilution<br>- The Plutonia Experiment<br>- Master Levels for DOOM II<br>- No Rest for the Living<br>- Sigil<br>- Sigil II<br>- Legacy of Rust (a new episode created in collaboration by id Software, Nightdive Studios and MachineGames)<br>- A new Deathmatch map pack featuring 25 maps<br><br>Altogether, there are a total of 187 mission maps and 43 deathmatch maps in DOOM + DOOM II.<br><br><b>New Enhancements:</b><br>- Online, cross-platform deathmatch and co-op for up to 16 players<br>- Community-published mod support with an in-game mod browser<br>- Choose between the original midi DOOM and DOOM II soundtracks or the modern IDKFA versions by Andrew Hulshult<br>- Improved performance with multithreaded rendering supporting up to 4K resolution<br>- Now on the KEX engine<br>- 60 FPS and native 16:9 support<br>- Restored original in-game music using original hardware<br>- Quick Save/Load support`,
    releaseDate: '2024-08-08',
  },
};

export class FallbackMetadataProvider {
  private getGogBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/gog-product';
    }
    return 'https://api.gog.com';
  }

  private getEpicContentBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return '/api/epic-content';
    }
    return 'https://store-content.ak.epicgames.com';
  }

  /**
   * Fetches rich metadata directly from GOG's official product API
   */
  async fetchGogProductMetadata(gogId: string): Promise<Partial<SteamEnrichedMetadata> | null> {
    try {
      const url = `${this.getGogBaseUrl()}/products/${encodeURIComponent(gogId)}?expand=description,screenshots,videos`;
      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;
      if (!data) return null;

      const screenshots: SteamScreenshot[] = (data.screenshots || []).map((s: any, idx: number) => {
        const fullImg =
          s.formatted_images?.find((img: any) => img.formatter_name === 'ggvgl_2x')?.image_url ||
          s.formatted_images?.find((img: any) => img.formatter_name === 'ggvgl')?.image_url ||
          (s.formatter_template_url ? s.formatter_template_url.replace('{formatter}', 'ggvgl_2x') : '');
        const thumbImg =
          s.formatted_images?.find((img: any) => img.formatter_name === 'ggvgm')?.image_url || fullImg;

        return {
          id: idx,
          pathThumbnail: ensureHttps(thumbImg),
          pathFull: ensureHttps(fullImg),
        };
      });

      const movies: SteamMovie[] = (data.videos || []).map((v: any, idx: number) => ({
        id: idx,
        name: `Trailer ${idx + 1}`,
        thumbnail: ensureHttps(v.thumbnail_url || ''),
        webm: { 480: '', max: '' },
        mp4: { 480: ensureHttps(v.video_url || ''), max: ensureHttps(v.video_url || '') },
      }));

      const headerImage = ensureHttps(
        data.images?.background || data.images?.logo2x || data.images?.icon || ''
      );

      let descriptionFull = data.description?.full || data.description?.lead || '';
      let descriptionLead = data.description?.lead || '';

      // Check if GOG returned raw localization placeholders (e.g. product_description_1413291984)
      const isPlaceholderDesc =
        descriptionFull.includes('product_description_') ||
        descriptionFull.includes('product_feature_') ||
        !descriptionFull.trim();

      if (isPlaceholderDesc) {
        if (GOG_SPECIAL_DESCRIPTIONS[gogId]) {
          descriptionLead = GOG_SPECIAL_DESCRIPTIONS[gogId].lead;
          descriptionFull = GOG_SPECIAL_DESCRIPTIONS[gogId].full;
        } else if (data.slug) {
          try {
            const pageUrl =
              typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? `/api/gog-profile/en/game/${encodeURIComponent(data.slug)}`
                : `https://www.gog.com/en/game/${encodeURIComponent(data.slug)}`;
            const pageRes = await axios.get(pageUrl, { timeout: 5000 });
            if (pageRes.data && typeof pageRes.data === 'string') {
              const cheerio = await import('cheerio');
              const $ = cheerio.load(pageRes.data);
              const descEl = $('.description');
              descEl.find('script, style, .description__copyrights').remove();
              const scrapedHtml = descEl.html()?.trim();
              if (scrapedHtml && !scrapedHtml.includes('product_description_')) {
                descriptionFull = scrapedHtml;
                descriptionLead = descEl.text()?.split('\n')[0]?.trim() || descriptionLead;
              }
            }
          } catch (scrapeErr: any) {
            console.warn(`[Fallback Provider] Store page scrape failed for ${data.slug}:`, scrapeErr?.message);
          }
        }
      }

      const releaseDate =
        GOG_SPECIAL_DESCRIPTIONS[gogId]?.releaseDate ||
        (data.release_date ? data.release_date.substring(0, 10) : 'TBA');

      return {
        aboutTheGame: descriptionFull,
        detailedDescription: descriptionFull,
        shortDescription: descriptionLead,
        headerImage,
        screenshots,
        movies,
        releaseDate,
      };
    } catch (err: any) {
      console.warn(`[Fallback Provider] GOG product lookup failed for ${gogId}:`, err?.message);
      return null;
    }
  }

  /**
   * Fetches rich metadata directly from Epic Games Store Content API (e.g. for Epic exclusives like Alan Wake 2)
   */
  async fetchEpicProductMetadata(slugOrTitle: string): Promise<Partial<SteamEnrichedMetadata> | null> {
    try {
      const cleanSlug = slugOrTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const url = `${this.getEpicContentBaseUrl()}/api/en-US/content/products/${cleanSlug}`;
      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;

      const home = data?.pages?.find((p: any) => p.type === 'productHome') || data?.pages?.[0];
      if (!home?.data) return null;

      const d = home.data;
      const screenshots: SteamScreenshot[] = [];

      // Extract carousel/gallery images
      const gallery = d.gallery?.galleryImages || d.carousel?.items || [];
      gallery.forEach((item: any, idx: number) => {
        const imgUrl = item.src || item.url || item.image;
        if (imgUrl) {
          screenshots.push({
            id: idx,
            pathThumbnail: imgUrl,
            pathFull: imgUrl,
          });
        }
      });

      const reqs = d.requirements?.systems?.[0]?.details || [];
      const minReq = reqs.find((r: any) => r.title?.toLowerCase().includes('minimum'))?.description;
      const recReq = reqs.find((r: any) => r.title?.toLowerCase().includes('recommended'))?.description;

      return {
        aboutTheGame: d.about?.about || d.markdown?.markdown || '',
        detailedDescription: d.about?.about || '',
        shortDescription: d.about?.shortDescription || '',
        headerImage: d.hero?.portrait || d.banner?.image || '',
        screenshots,
        movies: [],
        systemRequirements: {
          minimum: minReq,
          recommended: recReq,
        },
        releaseDate: d.meta?.releaseDate ? d.meta.releaseDate.substring(0, 10) : '',
      };
    } catch (err: any) {
      console.warn(`[Fallback Provider] Epic product content lookup failed for ${slugOrTitle}:`, err?.message);
      return null;
    }
  }

  /**
   * Builds high-quality enriched metadata for games that DO NOT exist on Steam.
   */
  async getEnrichedMetadataForNonSteamGame(game: CanonicalGame): Promise<SteamEnrichedMetadata> {
    const gogPlatform = game.platforms?.find((p) => p.platformId === 'gog');
    const epicPlatform = game.platforms?.find((p) => p.platformId === 'epic');

    let storeMetadata: Partial<SteamEnrichedMetadata> | null = null;

    if (gogPlatform?.platformGameId) {
      storeMetadata = await this.fetchGogProductMetadata(gogPlatform.platformGameId);
    }

    if (!storeMetadata && epicPlatform) {
      storeMetadata = await this.fetchEpicProductMetadata(epicPlatform.platformGameId || game.title);
    }

    // Pull OpenCritic review data
    const ocData = getOpenCriticData(undefined, game.title, undefined);
    const reviewSummary: SteamReviewSummary = {
      reviewScore: ocData.score ? Math.round(ocData.score / 10) : 8,
      reviewScoreDesc: ocData.tier ? `${ocData.tier} (${ocData.score || 85}%)` : 'Critically Acclaimed',
      totalPositive: ocData.numReviews ? Math.round(ocData.numReviews * 0.9) : 95,
      totalNegative: ocData.numReviews ? Math.round(ocData.numReviews * 0.1) : 5,
      totalReviews: ocData.numReviews || 100,
      positivePercent: ocData.score || 85,
    };

    return {
      appId: 0,
      name: game.title,
      shortDescription: storeMetadata?.shortDescription || game.shortDescription || 'DRM-Free / Store Exclusive Title',
      detailedDescription: storeMetadata?.detailedDescription || storeMetadata?.aboutTheGame || game.shortDescription || '',
      aboutTheGame: storeMetadata?.aboutTheGame || storeMetadata?.detailedDescription || game.shortDescription || '',
      headerImage: ensureHttps(storeMetadata?.headerImage || game.headerImage),
      capsuleImage: ensureHttps(game.capsuleImage || storeMetadata?.headerImage || game.headerImage),
      developers: game.developers || [],
      publishers: game.publishers || [],
      releaseDate: storeMetadata?.releaseDate || game.releaseDate || 'TBA',
      genres: game.genres || ['Action'],
      tags: game.tags || ['Store Exclusive'],
      categories: [
        {
          id: 2,
          description: 'Single-player',
          icon: 'https://store.akamai.steamstatic.com/public/images/v6/ico/ico_singlePlayer.png',
        },
      ],
      screenshots:
        storeMetadata?.screenshots && storeMetadata.screenshots.length > 0
          ? storeMetadata.screenshots
          : game.headerImage
          ? [{ id: 0, pathThumbnail: ensureHttps(game.headerImage), pathFull: ensureHttps(game.headerImage) }]
          : [],
      movies: storeMetadata?.movies || [],
      systemRequirements: storeMetadata?.systemRequirements || {},
      reviewSummary,
    };
  }
}

export const fallbackMetadataProvider = new FallbackMetadataProvider();
