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
  // Combine movies and screenshots in typical Steam order (movies first, then screenshots)
  const items: MediaItem[] = [
    ...movies.map((m) => ({ type: 'movie' as const, movie: m })),
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

  const handleScroll = (direction: 'left' | 'right') => {
    if (thumbStripRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      thumbStripRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

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
            {activeItem.movie.mp4.max || activeItem.movie.mp4['480'] || activeItem.movie.webm.max ? (
              <video
                ref={videoRef}
                controls
                width={1280}
                height={720}
                poster={activeItem.movie.thumbnail}
                preload="metadata"
                className="w-full h-full object-contain"
              >
                {activeItem.movie.mp4.max && (
                  <source src={activeItem.movie.mp4.max} type="video/mp4" />
                )}
                {activeItem.movie.webm.max && (
                  <source src={activeItem.movie.webm.max} type="video/webm" />
                )}
                {activeItem.movie.mp4['480'] && (
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
      <div className="relative flex items-center w-full px-7">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-[#101822]/90 hover:bg-steam-accent/30 text-white flex items-center justify-center border border-steam-border rounded-l transition-all shadow-md"
          aria-label="Previous thumbnails"
        >
          <ChevronLeft className="w-4 h-4 text-steam-accent" />
        </button>

        {/* Scrollable Thumbnails List */}
        <div
          ref={thumbStripRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full select-none"
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
                className={`relative flex-shrink-0 w-28 h-16 rounded overflow-hidden border-2 transition-all group/thumb ${
                  isSelected
                    ? 'border-steam-accent shadow-lg shadow-steam-accent/20 scale-[1.02]'
                    : 'border-[#1b2838] opacity-70 hover:opacity-100 hover:border-steam-subtext'
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
                      <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-16 bg-[#101822]/90 hover:bg-steam-accent/30 text-white flex items-center justify-center border border-steam-border rounded-r transition-all shadow-md"
          aria-label="Next thumbnails"
        >
          <ChevronRight className="w-4 h-4 text-steam-accent" />
        </button>
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
