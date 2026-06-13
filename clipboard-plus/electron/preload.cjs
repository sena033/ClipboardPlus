const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),
    clearHistory: () => ipcRenderer.invoke('clipboard:clearHistory'),
    deleteEntry: (id) => ipcRenderer.invoke('clipboard:deleteEntry', id),
    deleteEntries: (ids) => ipcRenderer.invoke('clipboard:deleteEntries', ids),
    toggleFavorite: (id) => ipcRenderer.invoke('clipboard:toggleFavorite', id),
    toggleArchive: (id) => ipcRenderer.invoke('clipboard:toggleArchive', id),
    copyToClipboard: (content) => ipcRenderer.invoke('clipboard:copyToClipboard', content),
    pasteEntry: (content) => ipcRenderer.invoke('clipboard:pasteEntry', content),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (s) => ipcRenderer.invoke('settings:update', s),
    pickPosition: () => ipcRenderer.invoke('settings:pickPosition'),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    hide: () => ipcRenderer.send('app:hide'),
    quit: () => ipcRenderer.send('app:quit'),
  },
  dialog: {
    selectWallpaper: () => ipcRenderer.invoke('dialog:selectWallpaper'),
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
