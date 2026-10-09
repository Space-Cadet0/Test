import React from 'react';
import { GamePlatformOwnership } from '../../contracts/game';
import { STOREFRONT_REGISTRY, StorefrontId } from '../../contracts/platform';
import { StorefrontIcon, getStorefrontDisplayName } from '../Common/StorefrontIcon';
import { CheckCircle2, Cloud } from 'lucide-react';

interface PlatformBadgesProps {
  platforms: GamePlatformOwnership[];
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical-stacked';
}

export const PlatformBadges: React.FC<PlatformBadgesProps> = ({
  platforms,
  size = 'md',
  layout = 'horizontal',
}) => {
  if (layout === 'vertical-stacked') {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        {platforms.map((p) => {
          const name = getStorefrontDisplayName(p.platformId);

          return (
            <div
              key={p.platformId}
              className="flex flex-col items-center justify-center p-1.5 rounded bg-[#16202d]/90 hover:bg-[#1f2c3d] border border-steam-border/80 hover:border-steam-accent/70 transition-all shadow-sm group min-w-[54px]"
              title={`${name} • ${p.installed ? 'Installed locally' : 'In Cloud Library'}`}
            >
              <div className="w-6 h-6 rounded flex items-center justify-center text-white/90 group-hover:text-steam-accent group-hover:scale-110 transition-all">
                <StorefrontIcon storefrontId={p.platformId} className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-steam-text/90 group-hover:text-white transition-colors text-center leading-tight mt-0.5">
                {name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {p.installed ? (
                  <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Installed
                  </span>
                ) : (
                  <span className="text-[9px] text-sky-400/80 font-medium flex items-center gap-0.5">
                    <Cloud className="w-2.5 h-2.5" /> Cloud
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((p) => {
        const meta = STOREFRONT_REGISTRY[p.platformId as StorefrontId] || {
          name: p.platformId.toUpperCase(),
          badgeBg: 'bg-zinc-800 border-zinc-700',
          badgeText: 'text-zinc-300',
        };
        const name = getStorefrontDisplayName(p.platformId);

        const sizeClasses =
          size === 'sm'
            ? 'px-1.5 py-0.5 text-[10px]'
            : size === 'lg'
            ? 'px-3 py-1 text-xs'
            : 'px-2 py-0.5 text-[11px]';

        return (
          <span
            key={p.platformId}
            className={`inline-flex items-center gap-1 font-medium border rounded transition-all shadow-sm ${meta.badgeBg} ${meta.badgeText} ${sizeClasses}`}
            title={`${name} • ${p.installed ? 'Installed locally' : 'In Cloud Library'}${p.installPath ? ` (${p.installPath})` : ''}`}
          >
            <StorefrontIcon storefrontId={p.platformId} className="w-3 h-3" />
            <span>{name}</span>
            {p.installed ? (
              <span className="flex items-center text-emerald-400" title="Installed">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </span>
            ) : (
              <span className="opacity-50 text-[10px]" title="Cloud Library">
                <Cloud className="w-2.5 h-2.5" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};
