import { useState, useEffect, useCallback } from 'react';
import type { NoteInfo } from '../types';

interface SidebarProps {
  notes: NoteInfo[];
  activeNote: string | null;
  onSelect: (name: string) => void;
  onCreate: () => void;
  onDelete: (name: string) => void;
  onRename: (oldName: string, newName: string) => void;
}

export default function Sidebar({ notes, activeNote, onSelect, onCreate, onDelete, onRename }: SidebarProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (name: string) => {
    setRenaming(name);
    setRenameValue(name.replace(/\.md$/i, ''));
  };

  const commitRename = useCallback((oldName: string) => {
    if (renameValue.trim() && renameValue.trim() !== oldName.replace(/\.md$/i, '')) {
      onRename(oldName, renameValue.trim() + '.md');
    }
    setRenaming(null);
  }, [renameValue, onRename]);

  const handleKeyDown = (e: React.KeyboardEvent, oldName: string) => {
    if (e.key === 'Enter') commitRename(oldName);
    if (e.key === 'Escape') setRenaming(null);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Notes</h2>
        <button className="icon-btn" onClick={onCreate} title="New note">
          +
        </button>
      </div>
      <div className="sidebar-list">
        {notes.length === 0 && (
          <div className="sidebar-empty">No notes yet. Click + to create.</div>
        )}
        {notes.map((note) => (
          <div
            key={note.name}
            className={`sidebar-item ${activeNote === note.name ? 'active' : ''}`}
            onClick={() => onSelect(note.name)}
          >
            {renaming === note.name ? (
              <input
                className="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(note.name)}
                onKeyDown={(e) => handleKeyDown(e, note.name)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className="sidebar-item-title">{note.title}</span>
                <span className="sidebar-item-actions">
                  <button
                    className="icon-btn-sm"
                    onClick={(e) => { e.stopPropagation(); startRename(note.name); }}
                    title="Rename"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn-sm danger"
                    onClick={(e) => { e.stopPropagation(); onDelete(note.name); }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
