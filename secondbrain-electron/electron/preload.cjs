const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Notes CRUD
  listNotes: () => ipcRenderer.invoke('notes:list'),
  readNote: (filename) => ipcRenderer.invoke('notes:read', filename),
  writeNote: (filename, content) => ipcRenderer.invoke('notes:write', filename, content),
  deleteNote: (filename) => ipcRenderer.invoke('notes:delete', filename),
  renameNote: (oldName, newName) => ipcRenderer.invoke('notes:rename', oldName, newName),
  createNote: (title) => ipcRenderer.invoke('notes:create', title),
  // Search
  searchNotes: (query) => ipcRenderer.invoke('notes:search', query),
});
