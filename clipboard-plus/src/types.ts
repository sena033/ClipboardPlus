export type ContentType = 'text' | 'image' | 'file';

export interface ClipboardEntry {
  id: string;
  type: ContentType;
  content: string;
  timestamp: number;
  favorite: boolean;
  archived: boolean;
}

export type GroupKey = 'all' | 'favorites' | 'today' | 'yesterday' | 'week' | 'month' | 'older' | 'archived';
export type PopupPosition = 'cursor' | 'center' | 'custom';
export type ThemeMode = 'dark' | 'light';
export type WallpaperFit = 'cover' | 'contain' | 'fill';

export const ALL_GROUPS: GroupKey[] = ['all', 'favorites', 'today', 'yesterday', 'week', 'month', 'older', 'archived'];

export interface AppSettings {
  hotkey: string;
  language: 'zh' | 'en';
  maxHistory: number;
  popupPosition: PopupPosition;
  popupX: number;
  popupY: number;
  accentColor: string;
  bgColor: string;
  wallpaperPath: string;
  theme: ThemeMode;
  wallpaperFit: WallpaperFit;
  enabledGroups: GroupKey[];
  groupLabels: Record<string, string>;
}

export interface ElectronAPI {
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>;
    clearHistory: () => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    toggleArchive: (id: string) => Promise<void>;
    copyToClipboard: (content: string) => Promise<void>;
    pasteEntry: (content: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<void>;
    pickPosition: () => Promise<{ x: number; y: number }>;
  };
  app: {
    getVersion: () => Promise<string>;
    quit: () => void;
  };
  dialog: {
    selectWallpaper: () => Promise<string | null>;
  };
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
