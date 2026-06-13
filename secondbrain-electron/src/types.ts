/// <reference types="vite/client" />

interface NoteInfo {
  name: string;
  title: string;
  modified: number;
}

interface SearchResult {
  name: string;
  title: string;
  snippet: string;
}

interface ReadResult {
  ok: boolean;
  content?: string;
  error?: string;
}

interface WriteResult {
  ok: boolean;
  error?: string;
}

interface CreateResult {
  ok: boolean;
  name?: string;
  error?: string;
}

interface ElectronAPI {
  listNotes: () => Promise<NoteInfo[]>;
  readNote: (filename: string) => Promise<ReadResult>;
  writeNote: (filename: string, content: string) => Promise<WriteResult>;
  deleteNote: (filename: string) => Promise<WriteResult>;
  renameNote: (oldName: string, newName: string) => Promise<WriteResult>;
  createNote: (title: string) => Promise<CreateResult>;
  searchNotes: (query: string) => Promise<SearchResult[]>;
}

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
