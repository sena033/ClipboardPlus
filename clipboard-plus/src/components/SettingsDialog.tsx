import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types';
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

  const handleSave = () => {
    onSave({
      hotkey, language: lang, maxHistory: maxHist,
      popupPosition: popupPos as any, popupX, popupY,
      accentColor, bgColor, wallpaperPath,
    });
    onClose();
  };

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
            <div className="popup-offsets">
              <div className="popup-offset-field">
                <span>{t('settings.popup_x')}</span>
                <input type="number" value={popupX} onChange={e => setPopupX(parseInt(e.target.value) || 0)} />
              </div>
              <div className="popup-offset-field">
                <span>{t('settings.popup_y')}</span>
                <input type="number" value={popupY} onChange={e => setPopupY(parseInt(e.target.value) || 0)} />
              </div>
            </div>
          )}
        </div>

        {/* Theme Section */}
        <div className="settings-section">{t('settings.theme')}</div>

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

        {/* Actions */}
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>{t('settings.save')}</button>
          <button className="btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
