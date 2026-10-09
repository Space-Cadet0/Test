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

export function formatDescriptionToHtml(rawDesc: string): string {
  if (!rawDesc) return '';
  // If already full HTML with paragraph or heading tags, return as-is
  if (rawDesc.includes('<p class="bb_paragraph">') || rawDesc.includes('<h2 class="bb_tag">')) {
    return rawDesc;
  }

  const lines = rawDesc.split(/\r?\n/);
  const htmlParts: string[] = [];
  let currentParagraph: string[] = [];

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>');
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        htmlParts.push(`<p class="bb_paragraph">${formatInline(text)}</p>`);
      }
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      htmlParts.push(`<h2 class="bb_tag">${formatInline(headingMatch[1].trim())}</h2>`);
      continue;
    }

    const boldOnlyMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldOnlyMatch) {
      flushParagraph();
      htmlParts.push(`<h2 class="bb_tag">${boldOnlyMatch[1].trim()}</h2>`);
      continue;
    }

    currentParagraph.push(trimmed);
  }

  flushParagraph();
  return htmlParts.join('\n');
}

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

      const url =
        typeof window !== 'undefined' && window.location.hostname === 'localhost'
          ? `/api/epic-content/api/en-US/content/products/${cleanSlug}`
          : `${this.getEpicContentBaseUrl()}/api/en-US/content/products/${cleanSlug}`;

      const res = await axios.get(url, { timeout: 8000 });
      const data = res.data;

      const home = data?.pages?.find((p: any) => p.type === 'productHome') || data?.pages?.[0];
      if (!home?.data) return null;

      const d = home.data;
      const screenshots: SteamScreenshot[] = [];
      const movies: SteamMovie[] = [];

      // Extract carousel items (videos and images)
      const carouselItems = d?.carousel?.items || [];
      carouselItems.forEach((item: any, idx: number) => {
        // 1. Extract image screenshots
        const rawImg =
          item.image?.src ||
          item.image?.url ||
          (typeof item.image === 'string' ? item.image : null) ||
          item.src ||
          item.url;
        if (rawImg && typeof rawImg === 'string' && !screenshots.some((s) => s.pathFull === rawImg)) {
          screenshots.push({
            id: idx,
            pathThumbnail: rawImg,
            pathFull: rawImg,
          });
        }

        // 2. Extract video trailers
        if (item.video?.recipes) {
          try {
            const recipes = typeof item.video.recipes === 'string' ? JSON.parse(item.video.recipes) : item.video.recipes;
            const langObj = recipes['en-US'] || recipes['en'] || Object.values(recipes)[0];
            if (Array.isArray(langObj)) {
              const hlsOutput = langObj.find((r: any) => r.recipe === 'video-hls')?.outputs?.find((o: any) => o.key === 'manifest');
              const mp4Output = langObj.find((r: any) => r.recipe === 'video-fmp4' || r.recipe === 'video-webm')?.outputs?.find((o: any) => o.key === 'manifest');
              const thumbOutput = langObj.find((r: any) => r.outputs?.some((o: any) => o.key === 'thumbnail'))?.outputs?.find((o: any) => o.key === 'thumbnail');

              const videoUrl = hlsOutput?.url || mp4Output?.url;
              const thumbUrl = thumbOutput?.url;

              if (videoUrl) {
                movies.push({
                  id: idx,
                  name: `Trailer ${movies.length + 1}`,
                  thumbnail: thumbUrl || '',
                  webm: { '480': videoUrl, max: videoUrl },
                  mp4: { '480': videoUrl, max: videoUrl },
                  hls: hlsOutput?.url,
                });
              }

              if (thumbUrl && !screenshots.some((s) => s.pathFull === thumbUrl)) {
                screenshots.push({
                  id: 1000 + idx,
                  pathThumbnail: thumbUrl,
                  pathFull: thumbUrl,
                });
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      });

      // Also check gallery images if available
      const galleryImages = d.gallery?.galleryImages || [];
      galleryImages.forEach((g: any, idx: number) => {
        const gUrl = g.src || g.url || (typeof g === 'string' ? g : null);
        if (gUrl && typeof gUrl === 'string' && !screenshots.some((s) => s.pathFull === gUrl)) {
          screenshots.push({
            id: 2000 + idx,
            pathThumbnail: gUrl,
            pathFull: gUrl,
          });
        }
      });

      const reqs = d.requirements?.systems?.[0]?.details || [];
      const minReq = reqs.map((r: any) => (r.title && r.minimum ? `<strong>${r.title}:</strong> ${r.minimum}` : '')).filter(Boolean).join('<br>');
      const recReq = reqs.map((r: any) => (r.title && r.recommended ? `<strong>${r.title}:</strong> ${r.recommended}` : '')).filter(Boolean).join('<br>');

      const descFull = d.about?.description || d.about?.about || d.markdown?.markdown || '';
      const formattedAbout = formatDescriptionToHtml(descFull);
      const descShort = d.about?.shortDescription || '';
      const headerImage =
        d.hero?.backgroundImageUrl ||
        d.hero?.portrait ||
        d.banner?.image ||
        d.about?.image?.src ||
        '';
      const capsuleImage =
        d.hero?.portraitBackgroundImageUrl ||
        d.hero?.portrait ||
        '';
      const iconUrl =
        d.hero?.logoImage?.src ||
        '';

      return {
        aboutTheGame: formattedAbout,
        detailedDescription: formattedAbout,
        shortDescription: descShort,
        headerImage,
        capsuleImage,
        iconUrl,
        screenshots,
        movies,
        systemRequirements: {
          minimum: minReq,
          recommended: recReq,
        },
        releaseDate: d.meta?.releaseDate ? d.meta.releaseDate.substring(0, 10) : '',
        developers: d.about?.developerAttribution ? [d.about.developerAttribution] : undefined,
        publishers: d.about?.publisherAttribution ? [d.about.publisherAttribution] : undefined,
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
      // First try slug derived from game title (e.g. "Alan Wake 2" -> "alan-wake-2")
      const titleSlug = game.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      storeMetadata = await this.fetchEpicProductMetadata(titleSlug);

      // If not found and platformGameId is not a raw hex hash, try platformGameId
      if (!storeMetadata && epicPlatform.platformGameId && !/^[0-9a-f]{20,}$/i.test(epicPlatform.platformGameId)) {
        storeMetadata = await this.fetchEpicProductMetadata(epicPlatform.platformGameId);
      }
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
      capsuleImage: ensureHttps(storeMetadata?.capsuleImage || game.capsuleImage || storeMetadata?.headerImage || game.headerImage),
      iconUrl: ensureHttps(storeMetadata?.iconUrl || game.iconUrl || ''),
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
