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
  for (const e of entries) {
    const g = getGroup(e.timestamp);
    counts[g] = (counts[g] || 0) + 1;
    if (e.favorite) counts['favorites'] = (counts['favorites'] || 0) + 1;
    if (e.archived) counts['archived'] = (counts['archived'] || 0) + 1;
  }
  counts['all'] = entries.filter(e => !e.archived).length;
  return counts;
}

function filterByGroup(entries: ClipboardEntry[], group: GroupKey): ClipboardEntry[] {
  const active = group !== 'archived' ? entries.filter(e => !e.archived) : entries;
  switch (group) {
    case 'all': return active;
    case 'favorites': return active.filter(e => e.favorite);
    case 'archived': return active.filter(e => e.archived);
    default: return active.filter(e => getGroup(e.timestamp) === group);
  }
}

function applyTheme(settings: AppSettings) {
  const root = document.documentElement;
  root.setAttribute('data-theme', settings.theme || 'dark');
  root.style.setProperty('--accent', settings.accentColor);
  root.style.setProperty('--bg-primary', settings.bgColor);
  root.style.setProperty('--wallpaper-fit', settings.wallpaperFit || 'cover');
  if (settings.wallpaperPath) {
    root.style.setProperty('--wallpaper', `url("file:///${settings.wallpaperPath.replace(/\\/g, '/')}")`);
  } else {
    root.style.setProperty('--wallpaper', 'none');
  }
}

export default function App() {
  const { history, deleteEntry, deleteEntries, toggleFavorite, toggleArchive, copyToClipboard, pasteEntry, clearHistory } = useHistory();
  const { settings, updateSettings } = useSettings();

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<GroupKey>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => { setToast(msg); }, []);

  // Listen for open-settings from menu
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.electronAPI.on('open-settings', handler);
    return () => window.electronAPI.removeListener('open-settings', handler);
  }, []);

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

  const handleSelect = useCallback(async (entry: ClipboardEntry) => {
    setSelectedId(entry.id);
    if (settings?.autoPaste) {
      await pasteEntry(entry.content);
      showToast(t('entry.pasted'));
    }
  }, [settings, pasteEntry, showToast]);

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
  const handleToggleArchive = useCallback(async (id: string) => {
    const entry = history.find(e => e.id === id);
    await toggleArchive(id);
    showToast(entry?.archived ? t('notify.unarchived') : t('notify.archived'));
  }, [history, toggleArchive, showToast]);

  // Context-aware clear: only clear entries in the current group, preserve favorites
  const handleClearGroup = useCallback(async () => {
    const toDelete = grouped.filter(e => !e.favorite).map(e => e.id);
    if (toDelete.length === 0) return;
    await deleteEntries(toDelete);
    setSelectedId(null);
    const groupLabel = settings?.groupLabels?.[selectedGroup] || t(`group.${selectedGroup}`);
    const skipped = grouped.length - toDelete.length;
    const msg = skipped > 0
      ? t('notify.cleared_skipped', { group: groupLabel, n: skipped })
      : t('notify.cleared', { group: groupLabel });
    showToast(msg);
  }, [grouped, deleteEntries, selectedGroup, settings, showToast]);

  const handleSaveSettings = useCallback(async (s: Partial<AppSettings>) => {
    if (settings) { await updateSettings(s); showToast(t('settings.saved')); }
  }, [settings, updateSettings, showToast]);

  const handleApplySettings = useCallback(async (s: Partial<AppSettings>) => {
    if (settings) { await updateSettings(s); showToast(t('settings.apply_success')); }
  }, [settings, updateSettings, showToast]);

  const hotkeyDisplay = settings?.hotkey
    ?.replace('Super', 'Win').replace('CommandOrControl', 'Ctrl').replace('+', ' + ') ?? 'Alt+V';

  const enabledGroups = settings?.enabledGroups ?? ['all', 'favorites', 'today', 'yesterday', 'week', 'month', 'older', 'archived'];
  const groupLabels = settings?.groupLabels ?? {};
  const groupLabel = groupLabels[selectedGroup] || t(`group.${selectedGroup}`);

  return (
    <div className="app">
      <div className="toolbar">
        <button className="toolbar-btn" onClick={() => setSettingsOpen(true)} title={t('context.settings')}>☰</button>
        <SearchBar value={search} onChange={setSearch} />
        <button
          className="toolbar-btn danger"
          onClick={handleClearGroup}
          title={t('context.clear_group', { group: groupLabel })}
        >
          ✕
        </button>
      </div>

      <div className="main-content">
        <Sidebar
          selected={selectedGroup}
          counts={counts}
          enabledGroups={enabledGroups}
          groupLabels={groupLabels}
          onSelect={g => { setSelectedGroup(g); setSelectedId(null); }}
        />
        <div className="content-area">
          <EntryList
            entries={filtered} selectedId={selectedId} onSelect={handleSelect}
            onCopy={handleCopy} onPaste={handlePaste} onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
            onToggleArchive={handleToggleArchive}
          />
        </div>
      </div>

      <DetailPanel entry={selected} onToggleFavorite={handleToggleFavorite} />

      <div className="status-bar">
        <span>{t('footer.items', { count: history.length })}</span>
        <span><kbd>{hotkeyDisplay}</kbd> {t('footer.hotkey', { hotkey: '' }).replace('{hotkey}', '')}</span>
      </div>

      <SettingsDialog
        open={settingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onApply={handleApplySettings}
        onClose={() => setSettingsOpen(false)}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}