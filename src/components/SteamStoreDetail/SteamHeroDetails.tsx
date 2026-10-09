import React from 'react';
import { SteamReviewSummary } from '../../contracts/steam';
import { HelpCircle } from 'lucide-react';

interface SteamHeroDetailsProps {
  headerImage: string;
  title: string;
  shortDescription?: string;
  reviewSummary?: SteamReviewSummary;
  releaseDate?: string;
  developers?: string[];
  publishers?: string[];
  tags?: string[];
}

export const SteamHeroDetails: React.FC<SteamHeroDetailsProps> = ({
  headerImage,
  title,
  shortDescription,
  reviewSummary,
  releaseDate = 'TBA',
  developers = [],
  publishers = [],
  tags = [],
}) => {
  // Determine Steam review text & color
  const getReviewColor = (desc?: string) => {
    if (!desc) return 'text-[#8f98a0]';
    const d = desc.toLowerCase();
    if (d.includes('positive')) return 'text-[#66C0F4]';
    if (d.includes('mixed')) return 'text-[#b9a074]';
    if (d.includes('negative')) return 'text-[#a34c25]';
    return 'text-[#8f98a0]';
  };

  const displayTags = tags.length > 0 ? tags.slice(0, 7) : ['Action', 'Adventure', 'Single-player'];

  return (
    <div className="w-full lg:w-[324px] lg:flex-shrink-0 flex flex-col justify-start text-steam-text select-none text-[12px]">
      {/* Header Capsule Artwork (324 x 151) */}
      <div className="w-full h-[151px] overflow-hidden bg-black/40 mb-2.5">
        <img
          src={headerImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Short Synopsis Description */}
      <div className="text-[13px] leading-[18px] text-[#c6d4df] mb-3 line-clamp-4 min-h-[54px]">
        {shortDescription || 'No overview available for this title.'}
      </div>

      {/* Steam Reviews Summary Block */}
      <div className="border-t border-b border-black/50 py-2 mb-2.5 space-y-1">
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            All Reviews:
          </span>
          {reviewSummary && reviewSummary.totalReviews > 0 ? (
            <div className="flex items-center gap-1">
              <span className={`font-bold hover:underline cursor-pointer ${getReviewColor(reviewSummary.reviewScoreDesc)}`}>
                {reviewSummary.reviewScoreDesc}
              </span>
              <span className="text-[#556772] font-normal">
                ({reviewSummary.totalReviews.toLocaleString()})
              </span>
              <HelpCircle className="w-3 h-3 text-[#556772] hover:text-[#66C0F4] cursor-pointer ml-0.5" />
            </div>
          ) : (
            <span className="text-[#8f98a0]">No user reviews</span>
          )}
        </div>
      </div>

      {/* Key Details Rows (Release Date, Developer, Publisher) */}
      <div className="space-y-1 mb-3">
        {/* Release Date */}
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            Release Date:
          </span>
          <span className="text-[#8f98a0]">{releaseDate}</span>
        </div>

        {/* Developer */}
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            Developer:
          </span>
          <span className="text-[#67c1f5] hover:underline cursor-pointer truncate">
            {developers.length > 0 ? developers.join(', ') : 'Unknown'}
          </span>
        </div>

        {/* Publisher */}
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            Publisher:
          </span>
          <span className="text-[#67c1f5] hover:underline cursor-pointer truncate">
            {publishers.length > 0 ? publishers.join(', ') : 'Unknown'}
          </span>
        </div>
      </div>

      {/* Popular User-Defined Tags (.glance_tags_ctn) */}
      <div className="pt-1">
        <div className="text-[11px] text-[#556772] mb-1.5">
          Popular user-defined tags for this product:
        </div>
        <div className="flex flex-wrap gap-[3px] items-center">
          {displayTags.map((tag, i) => (
            <a
              key={i}
              className="inline-block px-[7px] h-[19px] leading-[19px] text-[11px] bg-[rgba(103,193,245,0.2)] hover:bg-[rgba(103,193,245,0.4)] text-[#67c1f5] hover:text-white rounded-[2px] transition-colors cursor-pointer"
            >
              {tag}
            </a>
          ))}
          {/* Steam Plus Tag Button */}
          <div
            className="inline-flex items-center justify-center w-[19px] h-[19px] bg-[rgba(103,193,245,0.2)] hover:bg-[rgba(103,193,245,0.4)] text-[#67c1f5] hover:text-white rounded-[2px] cursor-pointer text-xs transition-colors"
            title="Add tags"
          >
            +
          </div>
        </div>
      </div>
    </div>
  );
};
