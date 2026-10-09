import React, { useState } from 'react';
import { GameCollection } from '../../contracts/collection';
import { CanonicalGame } from '../../contracts/game';
import { FolderPlus, X, Check, Trash2, Edit2, Bookmark, Star } from 'lucide-react';

interface ManageCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: GameCollection[];
  game?: CanonicalGame | null;
  onCreateCollection: (name: string) => void;
  onRenameCollection: (id: string, newName: string) => void;
  onDeleteCollection: (id: string) => void;
  onToggleGameInCollection: (collectionId: string, gameId: string) => void;
}

export const ManageCollectionsModal: React.FC<ManageCollectionsModalProps> = ({
  isOpen,
  onClose,
  collections,
  game,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onToggleGameInCollection,
}) => {
  const [newColName, setNewColName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onCreateCollection(newColName.trim());
    setNewColName('');
    setIsCreatingNew(false);
  };

  const handleRenameSubmit = (id: string) => {
    if (!editingName.trim()) return;
    onRenameCollection(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1b2838] border border-[#2a475e] rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-steam-text">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#121a24] border-b border-[#2a475e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-steam-accent" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {game ? `Collections: ${game.title}` : 'Manage Collections'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-steam-subtext hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {game && (
            <p className="text-xs text-[#8f98a0]">
              Assign <strong className="text-white">{game.title}</strong> to one or more user collections:
            </p>
          )}

          {/* Collections List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {collections.map((col) => {
              const isIncluded = game ? col.gameIds.includes(game.id) : false;
              const isEditing = editingId === col.id;

              return (
                <div
                  key={col.id}
                  className={`flex items-center justify-between px-3 py-2 rounded border transition-colors ${
                    isIncluded
                      ? 'bg-[#223547] border-steam-accent/50 text-white'
                      : 'bg-[#16202d] border-[#2a475e]/60 text-steam-text hover:bg-[#1f2d3d]'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-[#0e141b] border border-steam-accent text-white text-xs rounded px-2 py-1 flex-1 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameSubmit(col.id)}
                        className="px-2 py-1 bg-steam-accent text-white text-xs rounded font-semibold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-steam-subtext hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        onClick={() => game && onToggleGameInCollection(col.id, game.id)}
                        className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                      >
                        {game && (
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isIncluded
                                ? 'bg-steam-accent border-steam-accent text-white'
                                : 'border-[#4a5f73] bg-[#0e141b]'
                            }`}
                          >
                            {isIncluded && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        )}
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          {col.id === 'favorites' && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                          {col.name}
                        </span>
                        <span className="text-[10px] text-[#6b7b8c] font-normal">
                          ({col.gameIds.length} {col.gameIds.length === 1 ? 'game' : 'games'})
                        </span>
                      </div>

                      {/* Management Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(col.id);
                            setEditingName(col.name);
                          }}
                          className="p-1 text-steam-subtext hover:text-white rounded hover:bg-[#2a3c4e]"
                          title="Rename collection"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {!col.isDefault && (
                          <button
                            onClick={() => onDeleteCollection(col.id)}
                            className="p-1 text-steam-subtext hover:text-red-400 rounded hover:bg-[#2a3c4e]"
                            title="Delete collection"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Create New Collection Inline Form */}
          {isCreatingNew ? (
            <form onSubmit={handleCreateSubmit} className="pt-2 border-t border-[#2a475e]/60 space-y-2">
              <label className="text-[11px] font-semibold text-white uppercase tracking-wider block">
                Collection Name:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. RPGs, Backlog, Indie Gems..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="bg-[#0e141b] border border-[#2a475e] text-white text-xs rounded px-3 py-1.5 flex-1 focus:border-steam-accent outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-steam-accent hover:bg-sky-400 text-white font-semibold text-xs rounded transition-colors"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-2 py-1.5 text-xs text-steam-subtext hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2 px-3 border border-dashed border-[#2a475e] hover:border-steam-accent/70 rounded text-xs text-steam-accent hover:text-white flex items-center justify-center gap-1.5 transition-colors bg-[#141d27]/50 hover:bg-[#1b2838]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create New Collection</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#121a24] border-t border-[#2a475e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-steam-accent hover:bg-sky-400 text-white font-semibold text-xs rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
