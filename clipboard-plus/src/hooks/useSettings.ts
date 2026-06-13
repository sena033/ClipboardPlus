import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../types';
import { setLanguage } from '../i18n';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    window.electronAPI.settings.get().then(s => {
      setSettings(s);
      setLanguage(s.language);
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    await window.electronAPI.settings.update(updates);
    if (updates.language) setLanguage(updates.language);
    setSettings(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return { settings, updateSettings };
}
