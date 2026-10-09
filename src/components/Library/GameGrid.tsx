import React from 'react';
import { CanonicalGame } from '../../contracts/game';
import { GameCard } from './GameCard';
import { Gamepad2 } from 'lucide-react';

interface GameGridProps {
  games: CanonicalGame[];
  onSelectGame: (game: CanonicalGame) => void;
}

export const GameGrid: React.FC<GameGridProps> = ({ games, onSelectGame }) => {
  if (games.length === 0) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-center space-y-3">
        <Gamepad2 className="w-12 h-12 text-steam-subtext/40 stroke-1" />
        <h3 className="text-base font-semibold text-white">No games match your search or filter</h3>
        <p className="text-xs text-steam-subtext max-w-sm">
          Try clearing your active platform filter or searching for another title.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onSelect={onSelectGame} />
      ))}
    </div>
  );
};
