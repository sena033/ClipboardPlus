import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ThemeMode, WallpaperFit, GroupKey } from '../types';
import { ALL_GROUPS } from '../types';
import { t } from '../i18n';

interface Props {
  open: boolean;
  settings: AppSettings | null;
  onSave: (s: Partial<AppSettings>) => void;
  onClose: () => void;
}

function formatHotkey(key: string): string {
  return key.replace('Super', 'Win').replace('CommandOrControl', 'Ctrl').replace('+', ' + ');
}

export default function SettingsDialog({ open, settings, onSave, onClose }: Props) {
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
  const [enabledGroups, setEnabledGroups] = useState<GroupKey[]>(ALL_GROUPS);
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);

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
    if (result) setWallpaperPath(result);
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

  const updateGroupLabel = useCallback((g: GroupKey, label: string) => {
    setGroupLabels(prev => ({ ...prev, [g]: label }));
  }, []);

  const handleSave = () => {
    // Clean up empty labels
    const cleanLabels: Record<string, string> = {};
    for (const [k, v] of Object.entries(groupLabels)) {
      if (v.trim()) cleanLabels[k] = v.trim();
    }
    onSave({
      hotkey, language: lang, maxHistory: maxHist,
      popupPosition: popupPos as any, popupX, popupY,
      accentColor, bgColor, wallpaperPath,
      theme, wallpaperFit,
      enabledGroups, groupLabels: cleanLabels,
    });
    onClose();
  };

  if (!open) return null;

  const themeModeLabel = theme === 'dark' ? t('settings.theme.dark') : t('settings.theme.light');

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
              onClick={() => { setTheme('dark'); setAccentColor('#89b4fa'); setBgColor('#1e1e2e'); }}
            >
              🌙 {t('settings.theme.dark')}
            </button>
            <button
              className={`theme-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => { setTheme('light'); setAccentColor('#4375e0'); setBgColor('#f5f5f0'); }}
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
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
              <input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
            </div>
          </div>
          <div className="settings-field half">
            <label>{t('settings.bg_color')}</label>
            <div className="color-picker-row">
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
              <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} />
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
              <button className="btn-secondary btn-small btn-danger" onClick={() => setWallpaperPath('')}>
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
            <select value={wallpaperFit} onChange={e => setWallpaperFit(e.target.value as WallpaperFit)}>
              <option value="cover">{t('settings.fit.cover')}</option>
              <option value="contain">{t('settings.fit.contain')}</option>
              <option value="fill">{t('settings.fit.fill')}</option>
            </select>
          </div>
        )}

        {/* Sidebar Groups */}
        <div className="settings-section">{t('settings.sidebar')}</div>
        {ALL_GROUPS.map(g => {
          const defaultLabel = t(`group.${g}`);
          const currentLabel = groupLabels[g] || '';
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
                value={currentLabel}
                onChange={e => updateGroupLabel(g, e.target.value)}
              />
            </div>
          );
        })}

        {/* Actions */}
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>{t('settings.save')}</button>
          <button className="btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
