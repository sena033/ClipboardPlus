import type { ClipboardEntry } from '../types';
import { t } from '../i18n';

interface Props {
  entry: ClipboardEntry | null;
  onToggleFavorite: (id: string) => void;
}

export default function DetailPanel({ entry, onToggleFavorite }: Props) {
  if (!entry) return null;

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-info">
          <span className="detail-title">{t('detail.title')}</span>
          <span className="detail-chars">{t('detail.char_count', { count: entry.content.length })}</span>
        </div>
        <button
          className={`entry-fav${entry.favorite ? ' active' : ''}`}
          onClick={() => onToggleFavorite(entry.id)}
          title={entry.favorite ? t('entry.unfavorite') : t('entry.favorite')}
        >
          {entry.favorite ? '★' : '☆'}
        </button>
      </div>
      <div className="detail-content">{entry.content}</div>
    </div>
  );
}
