import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { ActiveGameFilter } from '../../contracts/filter';

interface SteamSidebarNoticesProps {
  title: string;
  steamAppId?: number;
  genres: string[];
  developers: string[];
  publishers: string[];
  releaseDate?: string;
  franchise?: string;
  legalNotice?: string;
  onApplyFilter?: (filter: ActiveGameFilter) => void;
}

export const SteamSidebarNotices: React.FC<SteamSidebarNoticesProps> = ({
  title,
  steamAppId,
  genres,
  developers,
  publishers,
  releaseDate,
  franchise,
  legalNotice,
  onApplyFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Steam Deck Compatibility Section */}
      <div className="mb-4">
        <div className="steam-block-title">
          Steam Deck Compatibility
        </div>
        <div className="p-2.5 bg-[#171a21] border border-[#2a475e]/60 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M6 3C4.34315 3 3 4.34315 3 6V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V6C21 4.34315 19.6569 3 18 3H6ZM7 6C7.55228 6 8 6.44772 8 7C8 7.55228 7.55228 8 7 8C6.44772 8 6 7.55228 6 7C6 6.44772 6.44772 6 7 6ZM7 16C7.55228 16 8 16.4477 8 17C8 17.5523 7.55228 18 7 18C6.44772 18 6 17.5523 6 17C6 16.4477 6.44772 16 7 16ZM17 6C17.5523 6 18 6.44772 18 7C18 7.55228 17.5523 8 17 8C16.4477 8 16 7.55228 16 7C16 6.44772 16.4477 6 17 6ZM17 16C17.5523 16 18 16.4477 18 17C18 17.5523 17.5523 18 17 18C16.4477 18 16 17.5523 16 17C16 16.4477 16.4477 16 17 16Z" />
            </svg>
            <span className="text-xs text-[#acb2b8] font-medium">Steam Deck</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-1.5 py-0.5 rounded-sm">
            VERIFIED
          </span>
        </div>
      </div>

      {/* Steam Details Block (Exact .game_details layout) */}
      <div className="steam-game-details mb-4">
        <div className="space-y-0.5">
          <div>
            <b>Title:</b> <span className="text-white">{title}</span>
          </div>

          <div>
            <b>Genre:</b>{' '}
            <span className="space-x-1">
              {genres.map((g, idx) => (
                <span key={idx}>
                  <button
                    type="button"
                    onClick={() => onApplyFilter?.({ type: 'genre', label: 'Genre', value: g })}
                    className="hover:underline hover:text-white transition-colors cursor-pointer text-[#67c1f5]"
                    title={`Filter library by genre "${g}"`}
                  >
                    {g}
                  </button>
                  {idx < genres.length - 1 && ', '}
                </span>
              ))}
            </span>
          </div>

          <div>
            <b>Developer:</b>{' '}
            {developers.map((d, idx) => (
              <span key={idx}>
                <button
                  type="button"
                  onClick={() => onApplyFilter?.({ type: 'developer', label: 'Developer', value: d })}
                  className="hover:underline hover:text-white transition-colors cursor-pointer text-[#67c1f5]"
                  title={`Filter library by developer "${d}"`}
                >
                  {d}
                </button>
                {idx < developers.length - 1 && ', '}
              </span>
            ))}
          </div>

          <div>
            <b>Publisher:</b>{' '}
            {publishers.map((p, idx) => (
              <span key={idx}>
                <button
                  type="button"
                  onClick={() => onApplyFilter?.({ type: 'publisher', label: 'Publisher', value: p })}
                  className="hover:underline hover:text-white transition-colors cursor-pointer text-[#67c1f5]"
                  title={`Filter library by publisher "${p}"`}
                >
                  {p}
                </button>
                {idx < publishers.length - 1 && ', '}
              </span>
            ))}
          </div>

          {franchise && (
            <div>
              <b>Franchise:</b>{' '}
              <button
                type="button"
                onClick={() => onApplyFilter?.({ type: 'tag', label: 'Franchise', value: franchise })}
                className="hover:underline hover:text-white transition-colors cursor-pointer text-[#67c1f5]"
                title={`Filter library by franchise "${franchise}"`}
              >
                {franchise}
              </button>
            </div>
          )}

          <div>
            <b>Release Date:</b> <span className="text-white">{releaseDate || 'TBA'}</span>
          </div>
        </div>
      </div>

      {/* Community & External Links (Exact Steam .linkbar styling) */}
      <div className="space-y-[2px]">
        {/* Discord / Official link */}
        <a
          href="https://discord.gg"
          target="_blank"
          rel="noreferrer"
          className="steam-linkbar-row"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            <span>Discord</span>
          </span>
          <ExternalLink className="w-3 h-3 opacity-60" />
        </a>

        {steamAppId && (
          <>
            <a
              href={`https://store.steampowered.com/newshub/?appids=${steamAppId}`}
              target="_blank"
              rel="noreferrer"
              className="steam-linkbar-row"
            >
              <span>View update history</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href={`https://store.steampowered.com/newshub/app/${steamAppId}`}
              target="_blank"
              rel="noreferrer"
              className="steam-linkbar-row"
            >
              <span>Read related news</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href={`https://steamcommunity.com/app/${steamAppId}/discussions/`}
              target="_blank"
              rel="noreferrer"
              className="steam-linkbar-row"
            >
              <span>View discussions</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href={`https://steamcommunity.com/actions/Search?T=ClanAccount&K=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noreferrer"
              className="steam-linkbar-row"
            >
              <span>Find Community Groups</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </a>
          </>
        )}
      </div>

      {legalNotice && (
        <div className="text-[10px] text-[#61686d] leading-normal border-t border-steam-border/30 pt-3">
          {legalNotice}
        </div>
      )}
    </div>
  );
};
