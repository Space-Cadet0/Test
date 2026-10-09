import { useState, useCallback, useEffect } from 'react';
import { ActiveGameFilter } from '../contracts/filter';

export interface NavHistoryEntry {
  view: 'game' | 'grid';
  selectedGameId: string | null;
  activeFilter: ActiveGameFilter | null;
  activeGroupId: string | null;
  title: string;
}

interface HistoryState {
  entries: NavHistoryEntry[];
  index: number;
}

export function useNavigationHistory(initialEntry: NavHistoryEntry) {
  const [historyState, setHistoryState] = useState<HistoryState>(() => ({
    entries: [initialEntry],
    index: 0,
  }));

  const { entries, index } = historyState;
  const currentEntry = entries[index] || initialEntry;

  const canGoBack = index > 0;
  const backEntry = canGoBack ? entries[index - 1] : null;
  const backTitle = backEntry ? backEntry.title : null;

  const canGoForward = index < entries.length - 1;
  const forwardEntry = canGoForward ? entries[index + 1] : null;
  const forwardTitle = forwardEntry ? forwardEntry.title : null;

  const pushEntry = useCallback((entry: NavHistoryEntry) => {
    setHistoryState((prev) => {
      const current = prev.entries[prev.index];
      // Do not push identical consecutive state
      if (
        current &&
        current.view === entry.view &&
        current.selectedGameId === entry.selectedGameId &&
        current.activeGroupId === entry.activeGroupId &&
        current.activeFilter?.type === entry.activeFilter?.type &&
        current.activeFilter?.value === entry.activeFilter?.value
      ) {
        return prev;
      }

      const truncated = prev.entries.slice(0, prev.index + 1);
      const nextEntries = [...truncated, entry];
      const clampedEntries =
        nextEntries.length > 50 ? nextEntries.slice(nextEntries.length - 50) : nextEntries;
      return {
        entries: clampedEntries,
        index: clampedEntries.length - 1,
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index <= 0) return prev;
      return {
        ...prev,
        index: prev.index - 1,
      };
    });
  }, []);

  const goForward = useCallback(() => {
    setHistoryState((prev) => {
      if (prev.index >= prev.entries.length - 1) return prev;
      return {
        ...prev,
        index: prev.index + 1,
      };
    });
  }, []);

  // Global keyboard shortcuts (Alt+Left / Cmd+[, Alt+Right / Cmd+], Backspace) and mouse buttons (3 & 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (isInput) return;

      // Back: Alt + Left or Cmd + [
      if ((e.altKey && e.key === 'ArrowLeft') || (e.metaKey && e.key === '[')) {
        if (canGoBack) {
          e.preventDefault();
          goBack();
        }
      }
      // Forward: Alt + Right or Cmd + ]
      else if ((e.altKey && e.key === 'ArrowRight') || (e.metaKey && e.key === ']')) {
        if (canGoForward) {
          e.preventDefault();
          goForward();
        }
      }
      // Backspace (only when not editing an input)
      else if (e.key === 'Backspace' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (canGoBack) {
          e.preventDefault();
          goBack();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        // Browser/Mouse Back button
        if (canGoBack) {
          e.preventDefault();
          goBack();
        }
      } else if (e.button === 4) {
        // Browser/Mouse Forward button
        if (canGoForward) {
          e.preventDefault();
          goForward();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [canGoBack, canGoForward, goBack, goForward]);

  return {
    currentEntry,
    canGoBack,
    backTitle,
    canGoForward,
    forwardTitle,
    pushEntry,
    goBack,
    goForward,
  };
}
