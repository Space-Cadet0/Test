import React from 'react';
import { SteamCategory } from '../../contracts/steam';
import { getSteamCategoryIconUrl } from '../../services/steam/steamApi';

interface SteamFeaturesListProps {
  categories?: SteamCategory[];
}

export const SteamFeaturesList: React.FC<SteamFeaturesListProps> = ({ categories = [] }) => {
  if (categories.length === 0) {
    // Default standard Steam features if none provided
    categories = [
      { id: 2, description: 'Single-player' },
      { id: 1, description: 'Multi-player' },
      { id: 36, description: 'Online PvP' },
      { id: 38, description: 'Online Co-op' },
      { id: 27, description: 'Cross-Platform Multiplayer' },
      { id: 22, description: 'Steam Achievements' },
      { id: 28, description: 'Full controller support' },
      { id: 61, description: 'HDR available' },
      { id: 62, description: 'Family Sharing' },
    ].map((c) => ({
      ...c,
      icon: getSteamCategoryIconUrl(c.id),
    }));
  }

  return (
    <div className="bg-[#16202d] rounded border border-steam-border p-3.5 shadow-sm space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-steam-text border-b border-steam-border/50 pb-2 mb-2.5">
        Features
      </div>

      <div className="space-y-1.5">
        {categories.map((cat) => {
          const iconUrl = cat.icon || getSteamCategoryIconUrl(cat.id);

          return (
            <div
              key={cat.id}
              className="group flex items-center gap-2.5 px-2.5 py-1.5 bg-[#101722]/80 hover:bg-[#192738] rounded border border-steam-border/50 hover:border-steam-accent/60 transition-all cursor-pointer"
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <img
                  src={iconUrl}
                  alt=""
                  className="w-5 h-5 object-contain filter drop-shadow opacity-75 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </div>
              <span className="text-xs text-steam-text group-hover:text-white transition-colors truncate font-medium">
                {cat.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
