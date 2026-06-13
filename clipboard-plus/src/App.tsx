import { useState, useEffect, useRef, useCallback } from 'react';
import type { ClipboardEntry } from './types';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function entryPreview(entry: ClipboardEntry): string {
  if (entry.type === 'image') return '[Image]';
  if (entry.type === 'file') return entry.content;
  return entry.content.slice(0, 120);
}

function entryIcon(entry: ClipboardEntry): string {
  if (entry.type === 'text') return 'T';
  if (entry.type === 'image') return '🖼';
  return '📎';
}

export default function App() {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    window.electronAPI.clipboard.getHistory().then(setHistory);
    const handler = (entries: ClipboardEntry[]) => {
      setHistory(entries);
    };
    window.electronAPI.on('clipboard-update', handler);
    return () => {
      window.electronAPI.removeListener('clipboard-update', handler);
    };
  }, []);

  const filtered = search
    ? history.filter(e =>
        e.content.toLowerCase().includes(search.toLowerCase())
      )
    : history;

  const selected = history.find(e => e.id === selectedId);

  const handleCopy = async (entry: ClipboardEntry) => {
    await window.electronAPI.clipboard.copyToClipboard(entry.content);
    showToast('Copied to clipboard');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await window.electronAPI.clipboard.deleteEntry(id);
  };

  const handleFav = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await window.electronAPI.clipboard.toggleFavorite(id);
  };

  const handleClearAll = async () => {
    await window.electronAPI.clipboard.clearHistory();
    showToast('History cleared');
  };

  return (
    <>
      {/* Title Bar */}
      <div className="title-bar">
        <h1>Clipboard Plus</h1>
        <div className="actions">
          <button onClick={handleClearAll} className="danger" title="Clear all">Clear</button>
          <button onClick={() => window.electronAPI.app.quit()} title="Quit">✕</button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search clipboard history..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* List */}
      <div className="history-list" ref={listRef}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            {search ? (
              <>
                <h2>No results</h2>
                <p>Try a different search term</p>
              </>
            ) : (
              <>
                <h2>Clipboard is empty</h2>
                <p>Copy something (<kbd>Ctrl+C</kbd>) and it will appear here</p>
                <p style={{ marginTop: 8, fontSize: 11 }}>
                  Press <kbd>Ctrl+Alt+V</kbd> to toggle this window
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map(entry => (
            <div
              key={entry.id}
              className={`entry${selectedId === entry.id ? ' selected' : ''}`}
              onClick={() => {
                setSelectedId(entry.id);
                handleCopy(entry);
              }}
            >
              <div className={`entry-icon ${entry.type}`}>{entryIcon(entry)}</div>
              <div className="entry-body">
                <div className="entry-preview">{entryPreview(entry)}</div>
                <div className="entry-meta">
                  <span className="entry-time">{formatTime(entry.timestamp)}</span>
                  <span className="entry-type-badge">{entry.type}</span>
                </div>
              </div>
              <button
                className={`entry-fav${entry.favorite ? ' active' : ''}`}
                onClick={e => handleFav(e, entry.id)}
                title={entry.favorite ? 'Unfavorite' : 'Favorite'}
              >
                {entry.favorite ? '★' : '☆'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="detail-panel">
          <div className="header">
            <span>Detail</span>
            <button
              className="entry-fav"
              onClick={() => window.electronAPI.clipboard.toggleFavorite(selected.id)}
            >
              {selected.favorite ? '★' : '☆'}
            </button>
          </div>
          <div className="content">{selected.content}</div>
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <span>{history.length} items</span>
        <span><kbd>Ctrl+Alt+V</kbd> toggle · Click to copy</span>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
