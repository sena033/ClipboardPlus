const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),
    clearHistory: () => ipcRenderer.invoke('clipboard:clearHistory'),
    deleteEntry: (id) => ipcRenderer.invoke('clipboard:deleteEntry', id),
    toggleFavorite: (id) => ipcRenderer.invoke('clipboard:toggleFavorite', id),
    copyToClipboard: (content) => ipcRenderer.invoke('clipboard:copyToClipboard', content),
    pasteEntry: (content) => ipcRenderer.invoke('clipboard:pasteEntry', content),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (s) => ipcRenderer.invoke('settings:update', s),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
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
