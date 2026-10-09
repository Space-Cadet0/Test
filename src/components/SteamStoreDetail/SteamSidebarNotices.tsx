import React from 'react';
import { Gamepad2, ShieldAlert, FileText, CheckCircle2, ChevronRight, ExternalLink } from 'lucide-react';

interface SteamSidebarNoticesProps {
  title: string;
  steamAppId?: number;
  genres: string[];
  developers: string[];
  publishers: string[];
  releaseDate?: string;
  legalNotice?: string;
}

export const SteamSidebarNotices: React.FC<SteamSidebarNoticesProps> = ({
  title,
  steamAppId,
  genres,
  developers,
  publishers,
  releaseDate,
}) => {
  return (
    <div className="space-y-4">
      {/* Controller Support Block */}
      <div className="bg-[#16202d] rounded border border-steam-border p-3.5 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Gamepad2 className="w-4 h-4 text-steam-accent" />
          <span>Full Controller Support</span>
        </div>
        <p className="text-[11px] text-steam-subtext leading-relaxed">
          Plays great with keyboard and mouse, Xbox Wireless Controllers, and PlayStation DualSense Controllers.
        </p>
      </div>

      {/* Steam Deck Compatibility Block */}
      <div className="bg-[#16202d] rounded border border-steam-border p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-steam-subtext">
            Steam Deck Compatibility
          </span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> VERIFIED
          </span>
        </div>
        <p className="text-[11px] text-steam-subtext leading-relaxed">
          Valve's testing indicates that {title} is fully functional on Steam Deck with built-in controls and legible display.
        </p>
      </div>

      {/* Anti-Cheat Software Notice */}
      <div className="bg-[#16202d] rounded border border-steam-border p-3.5 shadow-sm space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-steam-subtext">
          <ShieldAlert className="w-3.5 h-3.5 text-steam-accent" />
          <span className="font-semibold text-white">Uses Anti-Cheat Software</span>
        </div>
        <div className="text-xs text-steam-accent font-medium pl-5">
          Easy Anti-Cheat
        </div>
      </div>

      {/* 3rd-Party Agreement & EULA */}
      <div className="bg-[#16202d] rounded border border-steam-border p-3.5 shadow-sm space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-steam-subtext">
          <FileText className="w-3.5 h-3.5 text-steam-subtext" />
          <span>Requires agreement to a 3rd-party EULA</span>
        </div>
        <div className="text-xs text-steam-accent hover:underline cursor-pointer pl-5">
          {title} EULA
        </div>
      </div>

      {/* Steam Details Block (Title, Genre, Dev, Pub, Release) */}
      <div className="bg-[#16202d] rounded border border-steam-border p-4 shadow-sm space-y-2 text-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-steam-text border-b border-steam-border/50 pb-2 mb-2">
          Details
        </div>

        <div className="space-y-1.5 text-[11px] leading-relaxed">
          <div>
            <strong className="text-steam-subtext font-semibold">Title:</strong>{' '}
            <span className="text-white">{title}</span>
          </div>

          <div>
            <strong className="text-steam-subtext font-semibold">Genre:</strong>{' '}
            <span className="text-steam-accent hover:underline cursor-pointer">
              {genres.join(', ') || 'Action, Adventure'}
            </span>
          </div>

          <div>
            <strong className="text-steam-subtext font-semibold">Developer:</strong>{' '}
            <span className="text-steam-accent hover:underline cursor-pointer">
              {developers.join(', ') || 'Unknown'}
            </span>
          </div>

          <div>
            <strong className="text-steam-subtext font-semibold">Publisher:</strong>{' '}
            <span className="text-steam-accent hover:underline cursor-pointer">
              {publishers.join(', ') || 'Unknown'}
            </span>
          </div>

          <div>
            <strong className="text-steam-subtext font-semibold">Release Date:</strong>{' '}
            <span className="text-white">{releaseDate || 'TBA'}</span>
          </div>
        </div>

        {/* Community & Related Links Bar */}
        <div className="border-t border-steam-border/40 pt-3 mt-3 space-y-1.5">
          {steamAppId && (
            <>
              <a
                href={`https://steamcommunity.com/app/${steamAppId}/discussions/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between py-1 text-[11px] text-steam-text hover:text-white transition-colors group"
              >
                <span>View community discussions</span>
                <ChevronRight className="w-3.5 h-3.5 text-steam-subtext group-hover:text-steam-accent" />
              </a>

              <a
                href={`https://store.steampowered.com/news/app/${steamAppId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between py-1 text-[11px] text-steam-text hover:text-white transition-colors group"
              >
                <span>Read related news & updates</span>
                <ChevronRight className="w-3.5 h-3.5 text-steam-subtext group-hover:text-steam-accent" />
              </a>

              <a
                href={`https://steamcommunity.com/app/${steamAppId}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between py-1 text-[11px] text-steam-text hover:text-white transition-colors group"
              >
                <span>Find Community Hub</span>
                <ExternalLink className="w-3 h-3 text-steam-subtext group-hover:text-steam-accent" />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
