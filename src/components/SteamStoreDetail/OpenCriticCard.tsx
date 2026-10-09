import React from 'react';
import { OpenCriticData, getTierColor } from '../../services/opencritic/openCritic';
import { ExternalLink, Award, ThumbsUp, Sparkles, Newspaper, ShieldCheck } from 'lucide-react';

interface OpenCriticCardProps {
  openCritic: OpenCriticData;
  gameTitle: string;
}

export const OpenCriticCard: React.FC<OpenCriticCardProps> = ({ openCritic, gameTitle }) => {
  const colors = getTierColor(openCritic.tier);

  return (
    <div className="bg-[#121923] border border-[#2a475e] rounded p-4 shadow-lg text-steam-text select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#2a475e]/60">
        <div className="flex items-center gap-2.5">
          {/* OpenCritic Logo / Badge Icon */}
          <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-xs text-white ${colors.scoreBg} ${colors.glow}`}>
            OC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                OpenCritic Reviews
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${colors.badgeBg} ${colors.badgeBorder} ${colors.badgeText}`}
              >
                {openCritic.tier}
              </span>
            </div>
            <div className="text-[10px] text-steam-subtext">
              Aggregated critical consensus from top industry publications
            </div>
          </div>
        </div>

        <a
          href={openCritic.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-steam-accent hover:text-white hover:underline transition-colors group"
          title={`View full ${gameTitle} critical breakdown on OpenCritic`}
        >
          <span>View on OpenCritic</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* 4 Metrics Pillars Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Metric 1: Top Critic Average */}
        <div className="bg-[#182330] p-3 rounded border border-[#25394b] flex flex-col justify-between group hover:border-[#3d6385] transition-colors relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-steam-subtext mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-sky-400">
              <Award className="w-3.5 h-3.5 text-sky-400" />
              Top Critic Avg
            </span>
            <span className="text-[10px] text-steam-subtext/70">/ 100</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-black tracking-tight ${colors.accentText}`}>
              {openCritic.score}
            </span>
            <span className="text-xs text-steam-subtext font-medium">/ 100</span>
          </div>
          <div className="text-[10px] text-steam-subtext mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Top Critic Average</span>
          </div>
        </div>

        {/* Metric 2: Critics Recommend */}
        <div className="bg-[#182330] p-3 rounded border border-[#25394b] flex flex-col justify-between group hover:border-[#3d6385] transition-colors">
          <div className="flex items-center justify-between text-[11px] text-steam-subtext mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-emerald-400">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
              Recommend
            </span>
            <span className="text-[10px] text-steam-subtext/70">Ratio</span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-emerald-400 tracking-tight">
              {openCritic.percentRecommended}%
            </span>
          </div>
          <div className="text-[10px] text-steam-subtext mt-1">
            Critics Recommended
          </div>
        </div>

        {/* Metric 3: OpenCritic Rating Tier */}
        <div className="bg-[#182330] p-3 rounded border border-[#25394b] flex flex-col justify-between group hover:border-[#3d6385] transition-colors">
          <div className="flex items-center justify-between text-[11px] text-steam-subtext mb-1">
            <span className={`font-semibold uppercase tracking-wider flex items-center gap-1 ${colors.accentText}`}>
              <Sparkles className="w-3.5 h-3.5" />
              Tier Rating
            </span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-xl font-black tracking-tight ${colors.accentText}`}>
              {openCritic.tier}
            </span>
          </div>
          <div className="text-[10px] text-steam-subtext mt-1">
            {openCritic.percentile ? `${openCritic.percentile}th Percentile` : 'OpenCritic Award'}
          </div>
        </div>

        {/* Metric 4: Critic Reviews Count */}
        <div className="bg-[#182330] p-3 rounded border border-[#25394b] flex flex-col justify-between group hover:border-[#3d6385] transition-colors">
          <div className="flex items-center justify-between text-[11px] text-steam-subtext mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1 text-amber-400">
              <Newspaper className="w-3.5 h-3.5 text-amber-400" />
              Publication Count
            </span>
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-black text-white/90 tracking-tight">
              {openCritic.numReviews}
            </span>
            <span className="text-xs text-steam-subtext font-medium">reviews</span>
          </div>
          <div className="text-[10px] text-steam-subtext mt-1">
            Aggregated Reviews
          </div>
        </div>
      </div>

      {/* Summary Note Footer */}
      {openCritic.summary && (
        <div className="mt-3 pt-2.5 border-t border-[#2a475e]/40 flex items-start gap-2 text-[11px] text-[#acb2b8] leading-relaxed">
          <span className="text-steam-accent font-semibold flex-shrink-0">Critic Consensus:</span>
          <span className="italic">{openCritic.summary}</span>
        </div>
      )}
    </div>
  );
};
