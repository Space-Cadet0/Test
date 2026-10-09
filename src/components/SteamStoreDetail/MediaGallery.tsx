import React, { useState, useRef, useEffect } from 'react';
import { SteamScreenshot, SteamMovie } from '../../contracts/steam';
import { Play, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface MediaGalleryProps {
  screenshots: SteamScreenshot[];
  movies: SteamMovie[];
  headerImage?: string;
}

type MediaItem =
  | { type: 'movie'; movie: SteamMovie }
  | { type: 'screenshot'; screenshot: SteamScreenshot };

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  screenshots,
  movies,
  headerImage,
}) => {
  // Filter out regional non-English trailers (e.g. Chinese/Japanese dubs) when English trailers exist, matching official Steam store
  const hasEnglishMovies = movies.some((m) => !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(m.name));
  const visibleMovies = hasEnglishMovies
    ? movies.filter((m) => !/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(m.name))
    : movies;

  // Combine movies and screenshots in typical Steam order (movies first, then screenshots)
  const items: MediaItem[] = [
    ...visibleMovies.map((m) => ({ type: 'movie' as const, movie: m })),
    ...screenshots.map((s) => ({ type: 'screenshot' as const, screenshot: s })),
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);

  const activeItem = items[activeIndex] || (items.length > 0 ? items[0] : null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [activeIndex]);

  const selectItem = (index: number) => {
    setActiveIndex(index);
    // Smooth scroll the active thumbnail into view
    const strip = thumbStripRef.current;
    if (strip && strip.children[index]) {
      const child = strip.children[index] as HTMLElement;
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Primary Showcase Viewport */}
      <div className="relative aspect-video w-full bg-black/90 rounded overflow-hidden border border-steam-border shadow-xl group">
        {activeItem?.type === 'movie' ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {activeItem.movie.mp4?.max || activeItem.movie.mp4?.['480'] || activeItem.movie.webm?.max ? (
              <video
                ref={videoRef}
                controls
                width={1280}
                height={720}
                poster={activeItem.movie.thumbnail}
                preload="metadata"
                className="w-full h-full object-contain"
              >
                {activeItem.movie.mp4?.max && (
                  <source src={activeItem.movie.mp4.max} type="video/mp4" />
                )}
                {activeItem.movie.webm?.max && (
                  <source src={activeItem.movie.webm.max} type="video/webm" />
                )}
                {activeItem.movie.mp4?.['480'] && (
                  <source src={activeItem.movie.mp4['480']} type="video/mp4" />
                )}
              </video>
            ) : (
              // Newer Steam trailer with dash/hls stream thumbnail presentation
              <div className="relative w-full h-full">
                <img
                  src={activeItem.movie.thumbnail}
                  alt={activeItem.movie.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-steam-accent/20 border-2 border-steam-accent flex items-center justify-center text-white backdrop-blur shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  </div>
                  <span className="text-sm font-semibold tracking-wide text-white drop-shadow">
                    {activeItem.movie.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : activeItem?.type === 'screenshot' ? (
          <div
            className="relative w-full h-full cursor-pointer overflow-hidden"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img
              src={activeItem.screenshot.pathFull}
              alt="Screenshot"
              className="w-full h-full object-cover select-none transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(true);
              }}
              className="absolute bottom-3 right-3 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Full screen screenshot"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-steam-card">
            {headerImage ? (
              <img src={headerImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <span className="text-steam-subtext text-sm">No media available</span>
            )}
          </div>
        )}
      </div>

      {/* Steam Thumbnail Strip Carousel */}
      <div className="flex flex-col w-full mt-1">
        <div className="relative flex items-center w-full">
          {/* Left Arrow Button */}
          <button
            onClick={() => selectItem(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex-shrink-0 w-8 h-[65px] bg-black/70 hover:bg-[#67c1f5]/30 disabled:opacity-30 disabled:hover:bg-black/70 text-white flex items-center justify-center transition-all z-10"
            aria-label="Previous thumbnail"
          >
            <ChevronLeft className="w-4 h-4 text-steam-accent" />
          </button>

          {/* Scrollable Thumbnails List */}
          <div
            ref={thumbStripRef}
            className="flex items-center gap-[4px] overflow-x-auto scrollbar-none py-0.5 px-1 scroll-smooth w-full select-none bg-black/40"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {items.map((item, idx) => {
              const isSelected = idx === activeIndex;
              const thumbUrl =
                item.type === 'movie'
                  ? item.movie.thumbnail
                  : item.screenshot.pathThumbnail;

              return (
                <button
                  key={idx}
                  onClick={() => selectItem(idx)}
                  className={`relative flex-shrink-0 w-[116px] h-[65px] overflow-hidden transition-all bg-black ${
                    isSelected
                      ? 'border-2 border-white'
                      : 'border border-black/40 opacity-70 hover:opacity-100 hover:border-steam-subtext'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={item.type === 'movie' ? item.movie.name : `Thumbnail ${idx}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {item.type === 'movie' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="p-1 rounded-full bg-black/60 border border-white/40">
                        <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => selectItem(Math.min(items.length - 1, activeIndex + 1))}
            disabled={activeIndex >= items.length - 1}
            className="flex-shrink-0 w-8 h-[65px] bg-black/70 hover:bg-[#67c1f5]/30 disabled:opacity-30 disabled:hover:bg-black/70 text-white flex items-center justify-center transition-all z-10"
            aria-label="Next thumbnail"
          >
            <ChevronRight className="w-4 h-4 text-steam-accent" />
          </button>
        </div>

        {/* Steam Trackbar Slider under thumbnails */}
        {items.length > 1 && (
          <div className="w-full h-[9px] bg-black/60 rounded-none relative mt-1 overflow-hidden">
            <div
              className="h-full bg-[#3d4450] hover:bg-[#5c6576] rounded-none transition-all cursor-pointer"
              style={{
                width: `${Math.max(15, (5 / Math.max(5, items.length)) * 100)}%`,
                marginLeft: `${(activeIndex / Math.max(1, items.length - 1)) * (100 - Math.max(15, (5 / Math.max(5, items.length)) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Lightbox Modal for Screenshots */}
      {isLightboxOpen && activeItem?.type === 'screenshot' && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          <img
            src={activeItem.screenshot.pathFull}
            alt="Full size screenshot"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded shadow-2xl border border-white/10"
          />
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-6 px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-600"
          >
            Close (Esc)
          </button>
        </div>
      )}
    </div>
  );
};
