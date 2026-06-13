import { useCallback, useRef, useEffect, useState } from 'react';
import type { ClipboardEntry } from '../types';
import { t } from '../i18n';

interface Props {
  entry: ClipboardEntry;
  isSelected: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onToggleArchive: () => void;
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return t('time.just_now');
  if (diff < 3600000) return t('time.minutes_ago', { n: Math.floor(diff / 60000) });
  if (diff < 86400000) return t('time.hours_ago', { n: Math.floor(diff / 3600000) });
  return t('time.days_ago', { n: Math.floor(diff / 86400000) });
}

function entryIcon(type: string, archived: boolean): string {
  if (archived) return '📦';
  switch (type) {
    case 'text': return 'T';
    case 'image': return '🖼';
    default: return '📎';
  }
}

function entryPreview(content: string): string {
  return content.replace(/\s+/g, ' ').slice(0, 80);
}

export default function EntryItem({ entry, isSelected, onSelect, onCopy, onPaste, onDelete, onToggleFavorite, onToggleArchive }: Props) {
  const [ctxOpen, setCtxOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = () => setCtxOpen(false);
    if (ctxOpen) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [ctxOpen]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxOpen(true);
  }, []);

  const handleDoubleClick = useCallback(() => { onPaste(); }, [onPaste]);

  return (
    <div
      ref={ref}
      className={`entry-item${isSelected ? ' selected' : ''}${entry.archived ? ' archived' : ''}`}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      <div className="entry-icon">{entryIcon(entry.type, entry.archived)}</div>
      <div className="entry-body">
        <div className="entry-preview">{entryPreview(entry.content)}</div>
        <div className="entry-meta">
          <span className="entry-time">{formatTime(entry.timestamp)}</span>
          <span className="entry-type-badge">{t(`entry.type.${entry.type}`)}</span>
          {entry.archived && <span className="entry-type-badge archived-badge">{t('group.archived')}</span>}
        </div>
      </div>
      <button
        className={`entry-fav${entry.favorite ? ' active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
        title={entry.favorite ? t('entry.unfavorite') : t('entry.favorite')}
      >
        {entry.favorite ? '★' : '☆'}
      </button>

      {ctxOpen && (
        <div className="context-menu" style={{ left: ctxPos.x, top: ctxPos.y }} onClick={e => e.stopPropagation()}>
          <div className="ctx-item" onClick={() => { onCopy(); setCtxOpen(false); }}>{t('context.copy')}</div>
          <div className="ctx-item" onClick={() => { onPaste(); setCtxOpen(false); }}>{t('context.paste')}</div>
          <div className="ctx-divider" />
          <div className="ctx-item" onClick={() => { onToggleFavorite(); setCtxOpen(false); }}>
            {entry.favorite ? t('context.unfavorite') : t('context.favorite')}
          </div>
          <div className="ctx-item" onClick={() => { onToggleArchive(); setCtxOpen(false); }}>
            {entry.archived ? t('context.unarchive') : t('context.archive')}
          </div>
          <div className="ctx-divider" />
          <div className="ctx-item danger" onClick={() => { onDelete(); setCtxOpen(false); }}>{t('context.delete')}</div>
        </div>
      )}
    </div>
  );
}