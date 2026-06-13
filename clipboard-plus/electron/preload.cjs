const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  clipboard: {
    getHistory: () => ipcRenderer.invoke('clipboard:getHistory'),
    clearHistory: () => ipcRenderer.invoke('clipboard:clearHistory'),
    deleteEntry: (id) => ipcRenderer.invoke('clipboard:deleteEntry', id),
    toggleFavorite: (id) => ipcRenderer.invoke('clipboard:toggleFavorite', id),
    copyToClipboard: (content) => ipcRenderer.invoke('clipboard:copyToClipboard', content),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    quit: () => ipcRenderer.send('app:quit'),
  },
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
