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
  return key
    .replace('Super', 'Win')
    .replace('CommandOrControl', 'Ctrl')
    .replace('+', ' + ');
}

export default function SettingsDialog({ open, settings, onSave, onClose }: Props) {
  const [hotkey, setHotkey] = useState('');
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const [maxHist, setMaxHist] = useState(100);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (open && settings) {
      setHotkey(settings.hotkey);
      setLang(settings.language);
      setMaxHist(settings.maxHistory);
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
    // Ignore modifier-only presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return;

    // Only single letter/digit/F-keys
    if (key.length === 1 || key.startsWith('F')) {
      parts.push(key.length === 1 ? key.toUpperCase() : key);
      setHotkey(parts.join('+'));
      setListening(false);
    }
  }, [listening]);

  const handleSave = () => {
    onSave({ hotkey, language: lang, maxHistory: maxHist });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={e => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h2 className="settings-title">{t('settings.title')}</h2>

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

        <div className="settings-field">
          <label>{t('settings.language')}</label>
          <select value={lang} onChange={e => setLang(e.target.value as 'zh' | 'en')}>
            <option value="zh">{t('settings.language.zh')}</option>
            <option value="en">{t('settings.language.en')}</option>
          </select>
        </div>

        <div className="settings-field">
          <label>{t('settings.max_history')}</label>
          <input
            type="number"
            min={10}
            max={1000}
            value={maxHist}
            onChange={e => setMaxHist(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
          />
        </div>

        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>{t('settings.save')}</button>
          <button className="btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
        </div>
      </div>
    </div>
  );
}
