import React from 'react';
import { SteamReviewSummary } from '../../contracts/steam';
import { OpenCriticData, getTierColor } from '../../services/opencritic/openCritic';
import { ActiveGameFilter } from '../../contracts/filter';
import { HelpCircle, ExternalLink } from 'lucide-react';

interface SteamHeroDetailsProps {
  headerImage: string;
  title: string;
  shortDescription?: string;
  reviewSummary?: SteamReviewSummary;
  openCritic?: OpenCriticData;
  releaseDate?: string;
  developers?: string[];
  publishers?: string[];
  tags?: string[];
  onApplyFilter?: (filter: ActiveGameFilter) => void;
}

export const SteamHeroDetails: React.FC<SteamHeroDetailsProps> = ({
  headerImage,
  title,
  shortDescription,
  reviewSummary,
  openCritic,
  releaseDate = 'TBA',
  developers = [],
  publishers = [],
  tags = [],
  onApplyFilter,
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

      {/* Reviews Summary Block (Steam + OpenCritic) */}
      <div className="border-t border-b border-black/50 py-2 mb-2.5 space-y-1.5">
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            All Reviews:
          </span>
          {reviewSummary && reviewSummary.totalReviews > 0 ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  onApplyFilter?.({
                    type: 'review',
                    label: 'Reviews',
                    value: reviewSummary.reviewScoreDesc,
                  })
                }
                className={`font-bold hover:underline cursor-pointer text-left ${getReviewColor(reviewSummary.reviewScoreDesc)}`}
                title={`Filter library for other "${reviewSummary.reviewScoreDesc}" games`}
              >
                {reviewSummary.reviewScoreDesc}
              </button>
              <span className="text-[#556772] font-normal">
                ({reviewSummary.totalReviews.toLocaleString()})
              </span>
              <HelpCircle className="w-3 h-3 text-[#556772] hover:text-[#66C0F4] cursor-pointer ml-0.5" />
            </div>
          ) : (
            <span className="text-[#8f98a0]">No user reviews</span>
          )}
        </div>

        {/* OpenCritic Rating Row */}
        {openCritic && (
          <div className="flex items-center">
            <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
              OpenCritic:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onApplyFilter?.({
                    type: 'opencritic',
                    label: 'OpenCritic',
                    value: openCritic.tier,
                  })
                }
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold border hover:brightness-125 cursor-pointer ${getTierColor(openCritic.tier).badgeBg} ${getTierColor(openCritic.tier).badgeBorder} ${getTierColor(openCritic.tier).badgeText}`}
                title={`Filter library for ${openCritic.tier} OpenCritic games`}
              >
                {openCritic.score}
              </button>
              <button
                type="button"
                onClick={() =>
                  onApplyFilter?.({
                    type: 'opencritic',
                    label: 'OpenCritic',
                    value: openCritic.tier,
                  })
                }
                className={`font-bold hover:underline cursor-pointer ${getTierColor(openCritic.tier).accentText}`}
                title={`Filter library for ${openCritic.tier} OpenCritic games`}
              >
                {openCritic.tier}
              </button>
              <a
                href={openCritic.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#556772] hover:text-[#c6d4df] transition-colors ml-0.5"
                title={`View ${title} on OpenCritic.com`}
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-[#556772] font-normal text-[11px]">
                ({openCritic.percentRecommended}% rec)
              </span>
            </div>
          </div>
        )}
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
          <div className="truncate space-x-1">
            {developers.map((dev, idx) => (
              <span key={idx}>
                <button
                  type="button"
                  onClick={() => onApplyFilter?.({ type: 'developer', label: 'Developer', value: dev })}
                  className="text-[#67c1f5] hover:underline cursor-pointer hover:text-white transition-colors"
                  title={`Filter library by developer "${dev}"`}
                >
                  {dev}
                </button>
                {idx < developers.length - 1 && <span className="text-[#8f98a0]">, </span>}
              </span>
            ))}
            {developers.length === 0 && <span className="text-[#8f98a0]">Unknown</span>}
          </div>
        </div>

        {/* Publisher */}
        <div className="flex items-center">
          <span className="w-[94px] flex-shrink-0 text-[10px] uppercase text-[#556772] font-normal tracking-wider">
            Publisher:
          </span>
          <div className="truncate space-x-1">
            {publishers.map((pub, idx) => (
              <span key={idx}>
                <button
                  type="button"
                  onClick={() => onApplyFilter?.({ type: 'publisher', label: 'Publisher', value: pub })}
                  className="text-[#67c1f5] hover:underline cursor-pointer hover:text-white transition-colors"
                  title={`Filter library by publisher "${pub}"`}
                >
                  {pub}
                </button>
                {idx < publishers.length - 1 && <span className="text-[#8f98a0]">, </span>}
              </span>
            ))}
            {publishers.length === 0 && <span className="text-[#8f98a0]">Unknown</span>}
          </div>
        </div>
      </div>

      {/* Popular User-Defined Tags (.glance_tags_ctn) */}
      <div className="pt-1">
        <div className="text-[11px] text-[#556772] mb-1.5">
          Popular user-defined tags for this product:
        </div>
        <div className="flex flex-wrap gap-[3px] items-center">
          {displayTags.map((tag, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onApplyFilter?.({ type: 'tag', label: 'Tag', value: tag })}
              className="inline-block px-[7px] h-[19px] leading-[19px] text-[11px] bg-[rgba(103,193,245,0.2)] hover:bg-[rgba(103,193,245,0.4)] text-[#67c1f5] hover:text-white rounded-[2px] transition-colors cursor-pointer"
              title={`Filter library by tag "${tag}"`}
            >
              {tag}
            </button>
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
