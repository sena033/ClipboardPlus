export type ContentType = 'text' | 'image' | 'file';

export interface ClipboardEntry {
  id: string;
  type: ContentType;
  content: string;
  timestamp: number;
  favorite: boolean;
}

export type GroupKey = 'all' | 'favorites' | 'today' | 'yesterday' | 'week' | 'month' | 'older';

export interface AppSettings {
  hotkey: string;
  language: 'zh' | 'en';
  maxHistory: number;
}

export interface ElectronAPI {
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>;
    clearHistory: () => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    copyToClipboard: (content: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<void>;
  };
  app: {
    getVersion: () => Promise<string>;
    quit: () => void;
  };
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
