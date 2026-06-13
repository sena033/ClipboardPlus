export interface ClipboardEntry {
  id: string;
  type: 'text' | 'image' | 'file';
  content: string;
  timestamp: number;
  favorite: boolean;
}

export interface ElectronAPI {
  clipboard: {
    getHistory: () => Promise<ClipboardEntry[]>;
    clearHistory: () => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    toggleFavorite: (id: string) => Promise<void>;
    copyToClipboard: (content: string) => Promise<void>;
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
