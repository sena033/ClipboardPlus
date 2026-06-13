import { useRef, useEffect, useCallback } from 'react';
import type { ClipboardEntry } from '../types';
import { t } from '../i18n';
import EntryItem from './EntryItem';

interface Props {
  entries: ClipboardEntry[];
  selectedId: string | null;
  onSelect: (entry: ClipboardEntry) => void;
  onCopy: (entry: ClipboardEntry) => void;
  onPaste: (entry: ClipboardEntry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

export default function EntryList({ entries, selectedId, onSelect, onCopy, onPaste, onDelete, onToggleFavorite, onToggleArchive }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollToSelected = useCallback((id: string) => {
    const el = ref.current?.querySelector(`[data-id="${id}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, []);

  useEffect(() => {
    if (selectedId) scrollToSelected(selectedId);
  }, [selectedId, scrollToSelected]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (entries.length === 0) return;

      const idx = selectedId ? entries.findIndex(e => e.id === selectedId) : -1;
      let newIdx = idx;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          newIdx = Math.min(idx + 1, entries.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          newIdx = Math.max(idx - 1, 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (idx >= 0) {
            onCopy(entries[idx]);
          }
          return;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (idx >= 0) {
            onDelete(entries[idx].id);
          }
          return;
        default:
          return;
      }

      if (newIdx !== idx && newIdx >= 0) {
        onSelect(entries[newIdx]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entries, selectedId, onSelect, onCopy, onDelete]);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>{t('empty.title')}</h3>
        <p>{t('empty.hint')}</p>
      </div>
    );
  }

  return (
    <div className="entry-list" ref={ref}>
      {entries.map(entry => (
        <div key={entry.id} data-id={entry.id}>
          <EntryItem
            entry={entry}
            isSelected={selectedId === entry.id}
            onSelect={() => onSelect(entry)}
            onCopy={() => onCopy(entry)}
            onPaste={() => onPaste(entry)}
            onDelete={() => onDelete(entry.id)}
            onToggleFavorite={() => onToggleFavorite(entry.id)}
            onToggleArchive={() => onToggleArchive(entry.id)}
          />
        </div>
      ))}
    </div>
  );
}
