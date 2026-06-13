import { useState, useCallback, useMemo, useEffect } from 'react';
import type { ClipboardEntry, GroupKey, AppSettings } from './types';
import { t, setLanguage } from './i18n';
import { useHistory } from './hooks/useHistory';
import { useSettings } from './hooks/useSettings';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import EntryList from './components/EntryList';
import DetailPanel from './components/DetailPanel';
import SettingsDialog from './components/SettingsDialog';
import Toast from './components/Toast';

function getGroup(ts: number): GroupKey {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today) return 'today';
  if (d >= yesterday) return 'yesterday';
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());
  if (d >= weekStart) return 'week';
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (d >= monthStart) return 'month';
  return 'older';
}

function groupCounts(entries: ClipboardEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entries) { const g = getGroup(e.timestamp); counts[g] = (counts[g] || 0) + 1; }
  return counts;
}

function filterByGroup(entries: ClipboardEntry[], group: GroupKey): ClipboardEntry[] {
  switch (group) {
    case 'all': return entries;
    case 'favorites': return entries.filter(e => e.favorite);
    default: return entries.filter(e => getGroup(e.timestamp) === group);
  }
}

function applyTheme(settings: AppSettings) {
  const root = document.documentElement;
  root.style.setProperty('--accent', settings.accentColor);
  root.style.setProperty('--bg-primary', settings.bgColor);
  if (settings.wallpaperPath) {
    root.style.setProperty('--wallpaper', `url("file:///${settings.wallpaperPath.replace(/\\/g, '/')}")`);
  } else {
    root.style.setProperty('--wallpaper', 'none');
  }
}

export default function App() {
  const { history, deleteEntry, toggleFavorite, copyToClipboard, pasteEntry, clearHistory } = useHistory();
  const { settings, updateSettings } = useSettings();

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => { setToast(msg); }, []);

  // Apply theme when settings load or change
  useEffect(() => {
    if (settings) {
      setLanguage(settings.language);
      applyTheme(settings);
    }
  }, [settings]);

  const counts = useMemo(() => groupCounts(history), [history]);
  const grouped = useMemo(() => filterByGroup(history, selectedGroup), [history, selectedGroup]);
  const filtered = useMemo(
    () => search ? grouped.filter(e => e.content.toLowerCase().includes(search.toLowerCase())) : grouped,
    [grouped, search]
  );
  const selected = history.find(e => e.id === selectedId) || null;

  const handleSelect = useCallback((id: string) => { setSelectedId(id); }, []);
  const handleCopy = useCallback(async (entry: ClipboardEntry) => {
    await copyToClipboard(entry.content); showToast(t('entry.copied'));
  }, [copyToClipboard, showToast]);
  const handlePaste = useCallback(async (entry: ClipboardEntry) => {
    await pasteEntry(entry.content); showToast(t('entry.pasted'));
  }, [pasteEntry, showToast]);
  const handleDelete = useCallback(async (id: string) => {
    await deleteEntry(id); if (selectedId === id) setSelectedId(null); showToast(t('notify.deleted'));
  }, [deleteEntry, selectedId, showToast]);
  const handleToggleFavorite = useCallback(async (id: string) => {
    const entry = history.find(e => e.id === id);
    await toggleFavorite(id);
    showToast(entry?.favorite ? t('notify.unfavorited') : t('notify.favorited'));
  }, [history, toggleFavorite, showToast]);
  const handleClearAll = useCallback(async () => {
    await clearHistory(); setSelectedId(null); showToast(t('notify.cleared'));
  }, [clearHistory, showToast]);
  const handleSaveSettings = useCallback(async (s: Partial<AppSettings>) => {
    if (settings) { await updateSettings(s); showToast(t('settings.saved')); }
  }, [settings, updateSettings, showToast]);

  const hotkeyDisplay = settings?.hotkey
    ?.replace('Super', 'Win').replace('CommandOrControl', 'Ctrl').replace('+', ' + ') ?? 'Alt+V';

  return (
    <div className="app">
      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => setSettingsOpen(true)} title={t('context.settings')}>☰</button>
        <SearchBar value={search} onChange={setSearch} />
        <button className="toolbar-btn danger" onClick={handleClearAll} title={t('context.clear_all')}>✕</button>
      </div>

      <div className="main-content">
        <Sidebar selected={selectedGroup} counts={counts} onSelect={g => { setSelectedGroup(g); setSelectedId(null); }} />
        <div className="content-area">
          <EntryList
            entries={filtered} selectedId={selectedId} onSelect={handleSelect}
            onCopy={handleCopy} onPaste={handlePaste} onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      </div>

      <DetailPanel entry={selected} onToggleFavorite={handleToggleFavorite} />

      <div className="status-bar">
        <span>{t('footer.items', { count: history.length })}</span>
        <span><kbd>{hotkeyDisplay}</kbd> {t('footer.hotkey', { hotkey: '' }).replace('{hotkey}', '')}</span>
      </div>

      <SettingsDialog open={settingsOpen} settings={settings} onSave={handleSaveSettings} onClose={() => setSettingsOpen(false)} />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
