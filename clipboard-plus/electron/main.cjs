const { app, BrowserWindow, globalShortcut, Tray, Menu, clipboard: elClipboard, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// ── State ──
let mainWindow = null;
let tray = null;
let history = [];
let lastClipboardContent = '';
const MAX_HISTORY = 100;
const HISTORY_FILE = path.join(app.getPath('userData'), 'clipboard-history.json');

// ── Persistence ──
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
      history = JSON.parse(data);
    }
  } catch (e) { history = []; }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history), 'utf-8');
  } catch (e) { /* ignore */ }
}

function pruneHistory() {
  // keep max 100, sort by timestamp desc, remove oldest
  history.sort((a, b) => b.timestamp - a.timestamp);
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
}

function addEntry(type, content) {
  if (!content || (type === 'text' && content === lastClipboardContent)) return;
  if (type === 'text') lastClipboardContent = content;

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type,
    content,
    timestamp: Date.now(),
    favorite: false,
  };
  history.unshift(entry);
  pruneHistory();
  saveHistory();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clipboard-update', history);
  }
}

// ── Clipboard Polling ──
function startClipboardPolling() {
  setInterval(() => {
    try {
      // Check text
      const text = elClipboard.readText();
      if (text && text !== lastClipboardContent) {
        addEntry('text', text);
      }
    } catch (e) { /* ignore */ }
  }, 500);
}

// ── Tray Icon ──
function createTray() {
  // Create a simple 16x16 tray icon
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Simple "C" shape
      if (x >= 2 && x <= 13 && y >= 2 && y <= 13) {
        if (x === 2 || x === 13 || y === 2 || y === 13) {
          canvas[idx] = 137;     // R
          canvas[idx+1] = 180;   // G
          canvas[idx+2] = 250;   // B
          canvas[idx+3] = 255;   // A
        } else {
          canvas[idx] = 30;
          canvas[idx+1] = 30;
          canvas[idx+2] = 46;
          canvas[idx+3] = 0;
        }
      } else {
        canvas[idx] = 0;
        canvas[idx+1] = 0;
        canvas[idx+2] = 0;
        canvas[idx+3] = 0;
      }
    }
  }
  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });

  tray = new Tray(icon);
  tray.setToolTip('Clipboard Plus');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Clipboard', click: () => showWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => showWindow());
}

// ── Window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 600,
    resizable: true,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  // Hide instead of close
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

// ── IPC Handlers ──
function setupIPC() {
  ipcMain.handle('clipboard:getHistory', () => history);
  ipcMain.handle('clipboard:clearHistory', () => {
    history = [];
    lastClipboardContent = '';
    saveHistory();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard-update', history);
    }
  });
  ipcMain.handle('clipboard:deleteEntry', (_, id) => {
    history = history.filter(e => e.id !== id);
    saveHistory();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('clipboard-update', history);
    }
  });
  ipcMain.handle('clipboard:toggleFavorite', (_, id) => {
    const entry = history.find(e => e.id === id);
    if (entry) {
      entry.favorite = !entry.favorite;
      saveHistory();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-update', history);
      }
    }
  });
  ipcMain.handle('clipboard:copyToClipboard', (_, content) => {
    elClipboard.writeText(content);
  });
  ipcMain.handle('app:getVersion', () => app.getVersion());
}

// ── App Lifecycle ──
app.whenReady().then(() => {
  loadHistory();
  createWindow();
  createTray();
  setupIPC();
  startClipboardPolling();

  // Global shortcut
  globalShortcut.register('CommandOrControl+Alt+V', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  });

  app.on('activate', () => {
    if (mainWindow) showWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Don't quit on window close - tray keeps running
});
