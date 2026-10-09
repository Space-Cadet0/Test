import React from 'react';
import { SteamReviewSummary } from '../../contracts/steam';

interface ReviewSentimentBadgeProps {
  summary?: SteamReviewSummary;
  compact?: boolean;
}

export const ReviewSentimentBadge: React.FC<ReviewSentimentBadgeProps> = ({ summary, compact = false }) => {
  if (!summary || summary.totalReviews === 0) {
    return (
      <span className="text-steam-subtext text-xs italic">
        No user reviews
      </span>
    );
  }

  const { reviewScoreDesc, positivePercent, totalReviews } = summary;

  // Determine Steam review text color
  let scoreColorClass = 'text-[#66c0f4]'; // Default positive cyan
  if (reviewScoreDesc.toLowerCase().includes('mixed')) {
    scoreColorClass = 'text-[#b9a074]';
  } else if (reviewScoreDesc.toLowerCase().includes('negative')) {
    scoreColorClass = 'text-[#c35c2c]';
  }

  const formattedCount = totalReviews.toLocaleString();

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <span className={`font-semibold ${scoreColorClass}`}>{reviewScoreDesc}</span>
        <span className="text-steam-subtext">({positivePercent}%)</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm tracking-wide ${scoreColorClass}`}>
          {reviewScoreDesc}
        </span>
        <span className="text-xs text-steam-subtext font-normal">
          ({formattedCount} user reviews)
        </span>
      </div>
      <div className="text-[11px] text-steam-subtext">
        <span className="text-white font-medium">{positivePercent}%</span> of the {formattedCount} user reviews for this game are positive.
      </div>
    </div>
  );
};
