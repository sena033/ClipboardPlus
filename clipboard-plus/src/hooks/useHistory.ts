import { useState, useEffect, useCallback } from 'react';
import type { ClipboardEntry } from '../types';

export function useHistory() {
  const [history, setHistory] = useState<ClipboardEntry[]>([]);

  useEffect(() => {
    window.electronAPI.clipboard.getHistory().then(setHistory);
    const handler = (entries: ClipboardEntry[]) => setHistory(entries);
    window.electronAPI.on('clipboard-update', handler);
    return () => window.electronAPI.removeListener('clipboard-update', handler);
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await window.electronAPI.clipboard.deleteEntry(id);
  }, []);

  const deleteEntries = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await window.electronAPI.clipboard.deleteEntries(ids);
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    await window.electronAPI.clipboard.toggleFavorite(id);
  }, []);

  const toggleArchive = useCallback(async (id: string) => {
    await window.electronAPI.clipboard.toggleArchive(id);
  }, []);

  const copyToClipboard = useCallback(async (content: string) => {
    await window.electronAPI.clipboard.copyToClipboard(content);
  }, []);

  const pasteEntry = useCallback(async (content: string) => {
    await window.electronAPI.clipboard.pasteEntry(content);
  }, []);

  const clearHistory = useCallback(async () => {
    await window.electronAPI.clipboard.clearHistory();
  }, []);

  return { history, deleteEntry, deleteEntries, toggleFavorite, toggleArchive, copyToClipboard, pasteEntry, clearHistory };
}
