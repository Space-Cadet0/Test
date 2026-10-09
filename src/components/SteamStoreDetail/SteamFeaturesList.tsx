import React from 'react';
import { SteamCategory } from '../../contracts/steam';
import { getSteamCategoryIconUrl } from '../../services/steam/steamApi';

interface SteamFeaturesListProps {
  categories?: SteamCategory[];
  title?: string;
  hasAntiCheat?: boolean;
  antiCheatName?: string;
  hasEula?: boolean;
}

export const SteamFeaturesList: React.FC<SteamFeaturesListProps> = ({
  categories = [],
  title = 'Game',
  hasAntiCheat = true,
  antiCheatName = 'Easy Anti-Cheat',
  hasEula = true,
}) => {
  if (categories.length === 0) {
    categories = [
      { id: 2, description: 'Single-player' },
      { id: 36, description: 'Online PvP' },
      { id: 38, description: 'Online Co-op' },
      { id: 27, description: 'Cross-Platform Multiplayer' },
      { id: 22, description: 'Steam Achievements' },
      { id: 35, description: 'In-App Purchases' },
      { id: 61, description: 'HDR available' },
      { id: 62, description: 'Family Sharing' },
    ].map((c) => ({
      ...c,
      icon: getSteamCategoryIconUrl(c.id),
    }));
  }

  return (
    <div className="mb-4">
      {/* Features List Container */}
      <div className="space-y-[2px]">
        {categories.map((cat) => {
          const iconUrl = cat.icon || getSteamCategoryIconUrl(cat.id);

          return (
            <a
              key={cat.id}
              className="steam-spec-row group"
              title={cat.description}
            >
              <div className="spec-icon">
                <img
                  src={iconUrl}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="spec-label">
                <span>{cat.description}</span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Uses Anti-Cheat Software Notice */}
      {hasAntiCheat && (
        <div className="steam-anticheat-box">
          <div className="anticheat-title">Uses Anti-Cheat Software</div>
          <div className="anticheat-name">{antiCheatName}</div>
        </div>
      )}

      {/* Requires agreement to a 3rd-party EULA */}
      {hasEula && (
        <div className="steam-drm-box">
          <div>Requires agreement to a 3rd-party EULA</div>
          <div>
            <a href="#" onClick={(e) => e.preventDefault()}>
              {title} EULA
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
