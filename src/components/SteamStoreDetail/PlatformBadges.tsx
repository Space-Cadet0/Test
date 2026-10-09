import React from 'react';
import { GamePlatformOwnership } from '../../contracts/game';
import { STOREFRONT_REGISTRY, StorefrontId } from '../../contracts/platform';
import { CheckCircle2, HardDrive } from 'lucide-react';

interface PlatformBadgesProps {
  platforms: GamePlatformOwnership[];
  size?: 'sm' | 'md' | 'lg';
}

export const PlatformBadges: React.FC<PlatformBadgesProps> = ({ platforms, size = 'md' }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {platforms.map((p) => {
        const meta = STOREFRONT_REGISTRY[p.platformId as StorefrontId] || {
          name: p.platformId.toUpperCase(),
          badgeBg: 'bg-zinc-800 border-zinc-700',
          badgeText: 'text-zinc-300',
        };

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
            title={`${meta.name} • ${p.installed ? 'Installed locally' : 'In Cloud Library'}${p.installPath ? ` (${p.installPath})` : ''}`}
          >
            <span>{meta.name}</span>
            {p.installed ? (
              <span className="flex items-center text-emerald-400" title="Installed">
                <CheckCircle2 className="w-3 h-3" />
              </span>
            ) : (
              <span className="opacity-50 text-[10px]" title="Cloud Library">
                <HardDrive className="w-2.5 h-2.5" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};
