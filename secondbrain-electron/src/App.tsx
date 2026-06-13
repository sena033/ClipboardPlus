import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import SearchBar from './components/SearchBar';
import type { NoteInfo } from './types';
import './App.css';

const api = window.api;

function App() {
  const [notes, setNotes] = useState<NoteInfo[]>([]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Load note list
  const refreshNotes = useCallback(async () => {
    const list = await api.listNotes();
    setNotes(list);
    if (!activeNote && list.length > 0) {
      setActiveNote(list[0].name);
    }
  }, [activeNote]);

  useEffect(() => { refreshNotes(); }, []);

  // Load active note content
  useEffect(() => {
    if (!activeNote) return;
    (async () => {
      const result = await api.readNote(activeNote);
      if (result.ok) {
        setContent(result.content ?? '');
        setDirty(false);
      }
    })();
  }, [activeNote]);

  // Auto-save with debounce
  useEffect(() => {
    if (!activeNote || !dirty) return;
    const timer = setTimeout(async () => {
      await api.writeNote(activeNote, content);
      setDirty(false);
      const list = await api.listNotes();
      setNotes(list);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, dirty, activeNote]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        await handleCreate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeNote) {
          await api.writeNote(activeNote, content);
          setDirty(false);
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [activeNote, content]);

  const handleSelect = (name: string) => {
    if (activeNote && dirty) {
      api.writeNote(activeNote, content);
    }
    setActiveNote(name);
  };

  const handleCreate = async () => {
    const result = await api.createNote('untitled');
    if (result.ok && result.name) {
      await refreshNotes();
      setActiveNote(result.name!);
      setContent(`# untitled\n\n`);
      setDirty(true);
    } else {
      const ts = Date.now();
      const result2 = await api.createNote(`note-${ts}`);
      if (result2.ok && result2.name) {
        await refreshNotes();
        setActiveNote(result2.name!);
        setContent(`# Note ${ts}\n\n`);
        setDirty(true);
      }
    }
  };

  const handleDelete = async (name: string) => {
    await api.deleteNote(name);
    if (activeNote === name) {
      setActiveNote(null);
      setContent('');
    }
    await refreshNotes();
  };

  const handleRename = async (oldName: string, newName: string) => {
    const result = await api.renameNote(oldName, newName);
    if (result.ok) {
      if (activeNote === oldName) setActiveNote(newName);
      await refreshNotes();
    }
  };

  const handleSearch = useCallback(async (query: string) => {
    return await api.searchNotes(query);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setDirty(true);
  }, []);

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        notes={notes}
        activeNote={activeNote}
        onSelect={handleSelect}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onRename={handleRename}
      />
      <div className="main-area">
        <div className="toolbar">
          <SearchBar onSearch={handleSearch} onSelect={handleSelect} />
          <button
            className="icon-btn toolbar-btn"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="panes">
          {activeNote ? (
            <>
              <Editor content={content} onChange={handleContentChange} />
              <Preview content={content} />
            </>
          ) : (
            <div className="empty-state">
              <h2>Welcome to SecondBrain</h2>
              <p>Create a note to get started.</p>
              <p className="shortcuts-hint">
                <kbd>Ctrl+N</kbd> New note &middot;
                <kbd>Ctrl+S</kbd> Save &middot;
                <kbd>Ctrl+P</kbd> Search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
