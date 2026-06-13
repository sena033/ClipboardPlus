import { useState, useEffect, useCallback, useRef } from 'react';
import type { AppSettings, ThemeMode, WallpaperFit, GroupKey } from '../types';
import { ALL_GROUPS } from '../types';
import { t } from '../i18n';

interface Props {
  open: boolean;
  settings: AppSettings | null;
  onSave: (s: Partial<AppSettings>) => void;
  onApply: (s: Partial<AppSettings>) => void;
  onClose: () => void;
}

function formatHotkey(key: string): string {
  return key.replace('Super', 'Win').replace('CommandOrControl', 'Ctrl').replace('+', ' + ');
}

function previewWallpaper(path: string) {
  const root = document.documentElement;
  if (path) {
    root.style.setProperty('--wallpaper', `url("file:///${path.replace(/\\/g, '/')}")`);
  } else {
    root.style.setProperty('--wallpaper', 'none');
  }
}

function previewAccent(color: string) {
  document.documentElement.style.setProperty('--accent', color);
}

function previewBg(color: string) {
  document.documentElement.style.setProperty('--bg-primary', color);
}

function previewWallpaperFit(fit: string) {
  document.documentElement.style.setProperty('--wallpaper-fit', fit);
}

function previewTheme(mode: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', mode);
}

export default function SettingsDialog({ open, settings, onSave, onApply, onClose }: Props) {
  const [hotkey, setHotkey] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [maxHist, setMaxHist] = useState(100);
  const [popupPos, setPopupPos] = useState('cursor');
  const [popupX, setPopupX] = useState(200);
  const [popupY, setPopupY] = useState(100);
  const [accentColor, setAccentColor] = useState('#89b4fa');
  const [bgColor, setBgColor] = useState('#1e1e2e');
  const [wallpaperPath, setWallpaperPath] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [wallpaperFit, setWallpaperFit] = useState<WallpaperFit>('cover');
  const [autoPaste, setAutoPaste] = useState(false);
  const [enabledGroups, setEnabledGroups] = useState<GroupKey[]>(ALL_GROUPS);
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const groupInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset local state when dialog opens
  useEffect(() => {
    if (open && settings) {
      setHotkey(settings.hotkey);
      setLang(settings.language);
      setMaxHist(settings.maxHistory);
      setPopupPos(settings.popupPosition);
      setPopupX(settings.popupX);
      setPopupY(settings.popupY);
      setAccentColor(settings.accentColor);
      setBgColor(settings.bgColor);
      setWallpaperPath(settings.wallpaperPath);
      setTheme(settings.theme ?? 'dark');
      setWallpaperFit(settings.wallpaperFit ?? 'cover');
      setAutoPaste(settings.autoPaste ?? false);
      setEnabledGroups(settings.enabledGroups ?? ALL_GROUPS);
      setGroupLabels(settings.groupLabels ?? {});
      setListening(false);
    }
  }, [open, settings]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!listening) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('CommandOrControl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Super');

    const key = e.key;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;
    if (key.length === 1 || key.startsWith('F')) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
      setHotkey(parts.join('+'));
      setListening(false);
    }
  }, [listening]);

  const handleSelectWallpaper = async () => {
    const result = await window.electronAPI.dialog.selectWallpaper();
    if (result) {
      setWallpaperPath(result);
      previewWallpaper(result); // Immediate preview
    }
  };

  const handlePickPosition = async () => {
    try {
      const pos = await window.electronAPI.settings.pickPosition();
      if (pos) {
        setPopupX(pos.x);
        setPopupY(pos.y);
        setPopupPos('custom');
      }
    } catch (_) { /* IPC error */ }
  };

  const toggleGroup = useCallback((g: GroupKey) => {
    setEnabledGroups(prev => {
      if (prev.includes(g)) return prev.filter(x => x !== g);
      return [...prev, g];
    });
  }, []);

  const collectUpdates = useCallback((): Partial<AppSettings> => {
    const cleanLabels: Record<string, string> = {};
    for (const g of ALL_GROUPS) {
      const el = groupInputRefs.current[g];
      if (el && el.value.trim()) cleanLabels[g] = el.value.trim();
    }
    return {
      hotkey, language: lang, maxHistory: maxHist,
      popupPosition: popupPos as any, popupX, popupY,
      accentColor, bgColor, wallpaperPath,
      theme, wallpaperFit,
      autoPaste,
      enabledGroups, groupLabels: cleanLabels,
    };
  }, [hotkey, lang, maxHist, popupPos, popupX, popupY, accentColor, bgColor, wallpaperPath, theme, wallpaperFit, autoPaste, enabledGroups]);

  const handleSave = useCallback(() => {
    onSave(collectUpdates());
    onClose();
  }, [collectUpdates, onSave, onClose]);

  const handleApply = useCallback(() => {
    onApply(collectUpdates());
  }, [collectUpdates, onApply]);

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h2 className="settings-title">{t('settings.title')}</h2>

        {/* Hotkey */}
        <div className="settings-field">
          <label>{t('settings.hotkey')}</label>
          <div
            className={`hotkey-input${listening ? ' listening' : ''}`}
            tabIndex={0}
            onClick={() => setListening(true)}
            onBlur={() => setListening(false)}
          >
            {listening ? '...' : formatHotkey(hotkey)}
          </div>
          <span className="field-hint">{t('settings.hotkey_hint')}</span>
        </div>

        {/* Language */}
        <div className="settings-field">
          <label>{t('settings.language')}</label>
          <select value={lang} onChange={e => setLang(e.target.value as 'zh' | 'en')}>
            <option value="zh">{t('settings.language.zh')}</option>
            <option value="en">{t('settings.language.en')}</option>
          </select>
        </div>

        {/* Max History */}
        <div className="settings-field">
          <label>{t('settings.max_history')}</label>
          <input
            type="number" min={10} max={1000}
            value={maxHist}
            onChange={e => setMaxHist(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
          />
        </div>

        {/* Popup Position */}
        <div className="settings-field">
          <label>{t('settings.popup_position')}</label>
          <select value={popupPos} onChange={e => setPopupPos(e.target.value)}>
            <option value="cursor">{t('settings.popup.cursor')}</option>
            <option value="center">{t('settings.popup.center')}</option>
            <option value="custom">{t('settings.popup.custom')}</option>
          </select>
          {popupPos === 'custom' && (
            <div className="popup-picker">
              <button className="btn-secondary btn-small" onClick={handlePickPosition}>
                {t('settings.use_current_pos')}
              </button>
              <span className="field-hint pos-coords">
                {popupX}, {popupY}
              </span>
              <span className="field-hint">{t('settings.position_hint')}</span>
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="settings-section">{t('settings.theme')}</div>

        {/* Theme Mode Toggle */}
        <div className="settings-field">
          <label>{t('settings.theme_mode')}</label>
          <div className="theme-toggle">
            <button
              className={`theme-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => { setTheme('dark'); setAccentColor('#89b4fa'); setBgColor('#1e1e2e'); previewTheme('dark'); previewAccent('#89b4fa'); previewBg('#1e1e2e'); }}
            >
              🌙 {t('settings.theme.dark')}
            </button>
            <button
              className={`theme-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => { setTheme('light'); setAccentColor('#4375e0'); setBgColor('#f5f5f0'); previewTheme('light'); previewAccent('#4375e0'); previewBg('#f5f5f0'); }}
            >
              ☀️ {t('settings.theme.light')}
            </button>
          </div>
        </div>

        {/* Accent Color */}
        <div className="settings-field-row">
          <div className="settings-field half">
            <label>{t('settings.accent_color')}</label>
            <div className="color-picker-row">
              <input type="color" value={accentColor} onChange={e => { setAccentColor(e.target.value); previewAccent(e.target.value); }} />
              <input type="text" value={accentColor} onChange={e => { setAccentColor(e.target.value); previewAccent(e.target.value); }} />
            </div>
          </div>
          <div className="settings-field half">
            <label>{t('settings.bg_color')}</label>
            <div className="color-picker-row">
              <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); previewBg(e.target.value); }} />
              <input type="text" value={bgColor} onChange={e => { setBgColor(e.target.value); previewBg(e.target.value); }} />
            </div>
          </div>
        </div>

        {/* Wallpaper */}
        <div className="settings-field">
          <label>{t('settings.wallpaper')}</label>
          <div className="wallpaper-row">
            <button className="btn-secondary btn-small" onClick={handleSelectWallpaper}>
              {t('settings.select_wallpaper')}
            </button>
            {wallpaperPath && (
              <button className="btn-secondary btn-small btn-danger" onClick={() => { setWallpaperPath(''); previewWallpaper(''); }}>
                {t('settings.remove_wallpaper')}
              </button>
            )}
          </div>
          {wallpaperPath && <span className="field-hint file-path">{wallpaperPath}</span>}
        </div>

        {/* Wallpaper Fit */}
        {wallpaperPath && (
          <div className="settings-field">
            <label>{t('settings.wallpaper_fit')}</label>
            <select value={wallpaperFit} onChange={e => { const v = e.target.value as WallpaperFit; setWallpaperFit(v); previewWallpaperFit(v); }}>
              <option value="cover">{t('settings.fit.cover')}</option>
              <option value="contain">{t('settings.fit.contain')}</option>
              <option value="fill">{t('settings.fit.fill')}</option>
            </select>
          </div>
        )}

        {/* Auto Paste */}
        <div className="settings-section">{t('settings.auto_paste')}</div>
        <div className="settings-field">
          <label className="toggle-row">
            <input
              type="checkbox"
              checked={autoPaste}
              onChange={e => setAutoPaste(e.target.checked)}
            />
            <span>{t('settings.auto_paste')}</span>
          </label>
          <span className="field-hint">{t('settings.auto_paste_hint')}</span>
        </div>

        {/* Sidebar Groups */}
        <div className="settings-section">{t('settings.sidebar')}</div>
        {ALL_GROUPS.map(g => {
          const defaultLabel = t(`group.${g}`);
          return (
            <div key={g} className="settings-field group-setting-row">
              <label className="group-setting-label">
                <input
                  type="checkbox"
                  checked={enabledGroups.includes(g)}
                  onChange={() => toggleGroup(g)}
                />
                <span>{t('settings.group_visible')}</span>
                <span className="group-default-name">{defaultLabel}</span>
              </label>
              <input
                className="group-rename-input"
                type="text"
                placeholder={defaultLabel}
                defaultValue={groupLabels[g] || ''}
                ref={el => { groupInputRefs.current[g] = el; }}
              />
            </div>
          );
        })}

        {/* Actions */}
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>{t('settings.save')}</button>
          <button className="btn-secondary" onClick={handleApply}>{t('settings.apply')}</button>
          <button className="btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
        </div>
      </div>
    </div>
  );
}