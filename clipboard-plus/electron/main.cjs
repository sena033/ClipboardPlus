const {
  app, BrowserWindow, globalShortcut, Tray, Menu,
  clipboard: elClipboard, nativeImage, ipcMain,
} = require('electron');
const path = require('path');
const fs = require('fs');

// ── State ──
let mainWindow = null;
let tray = null;
let history = [];
let lastClipboardContent = '';
const HISTORY_FILE = path.join(app.getPath('userData'), 'clipboard-history.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

// ── Default Settings ──
const DEFAULT_SETTINGS = {
  hotkey: 'Super+V',
  language: 'zh',
  maxHistory: 100,
};

let settings = { ...DEFAULT_SETTINGS };

// ── Settings Persistence ──
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) { /* use defaults */ }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) { /* ignore */ }
}

// ── History Persistence ──
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
  history.sort((a, b) => b.timestamp - a.timestamp);
  if (history.length > settings.maxHistory) {
    history = history.slice(0, settings.maxHistory);
  }
}

function addEntry(type, content) {
  if (!content || (type === 'text' && content === lastClipboardContent)) return;
  if (type === 'text') lastClipboardContent = content;

  // Deduplicate: if same text already exists, move it to top instead of adding duplicate
  const existing = history.findIndex(e => e.type === type && e.content === content);
  if (existing >= 0) {
    const entry = history.splice(existing, 1)[0];
    entry.timestamp = Date.now();
    history.unshift(entry);
    pruneHistory();
    saveHistory();
    notifyUpdate();
    return;
  }

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
  notifyUpdate();
}

function notifyUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clipboard-update', history);
  }
}

// ── Clipboard Polling (two-way: detect external copies) ──
function startClipboardPolling() {
  // Seed with current clipboard on startup
  try {
    const initialText = elClipboard.readText();
    if (initialText) lastClipboardContent = initialText;
  } catch (_) {}

  setInterval(() => {
    try {
      const text = elClipboard.readText();
      if (text && text !== lastClipboardContent) {
        addEntry('text', text);
      }
    } catch (_) { /* ignore */ }
  }, 500);
}

// ── Hotkey ──
function registerHotkey(hotkey) {
  globalShortcut.unregisterAll();

  const key = hotkey || DEFAULT_SETTINGS.hotkey;
  const handler = () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showWindow();
    }
  };

  try {
    const ok = globalShortcut.register(key, handler);
    if (!ok) {
      console.warn(`[clipboard-plus] Hotkey "${key}" registration failed, trying Alt+V`);
      globalShortcut.register('Alt+V', handler);
    }
  } catch (e) {
    console.error(`[clipboard-plus] Hotkey error:`, e);
    try { globalShortcut.register('Alt+V', handler); } catch (_) {}
  }
}

function reregisterHotkey() {
  registerHotkey(settings.hotkey);
}

// ── Tray ──
function createTray() {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (x >= 2 && x <= 13 && y >= 2 && y <= 13) {
        if (x === 2 || x === 13 || y === 2 || y === 13) {
          canvas[idx] = 137; canvas[idx + 1] = 180; canvas[idx + 2] = 250; canvas[idx + 3] = 255;
        } else {
          canvas[idx] = 30; canvas[idx + 1] = 30; canvas[idx + 2] = 46; canvas[idx + 3] = 0;
        }
      } else {
        canvas[idx] = 0; canvas[idx + 1] = 0; canvas[idx + 2] = 0; canvas[idx + 3] = 0;
      }
    }
  }
  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });

  tray = new Tray(icon);
  tray.setToolTip(settings.language === 'zh' ? '剪贴板增强' : 'Clipboard Plus');

  buildTrayMenu();
  tray.on('click', () => showWindow());
}

function buildTrayMenu() {
  const isZh = settings.language === 'zh';
  const contextMenu = Menu.buildFromTemplate([
    { label: isZh ? '显示剪贴板' : 'Show Clipboard', click: () => showWindow() },
    { type: 'separator' },
    { label: isZh ? '设置' : 'Settings', click: () => { mainWindow?.webContents.send('open-settings'); showWindow(); } },
    { type: 'separator' },
    { label: isZh ? '退出' : 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
}

// ── Window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 680,
    height: 500,
    resizable: true,
    frame: true,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

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
    mainWindow.webContents.send('clipboard-update', history);
  }
}

// ── Simulate Ctrl+V paste ──
function pasteContent(content) {
  // Write to clipboard then send paste keystroke to focused window
  elClipboard.writeText(content);
  const { BrowserWindow: BW } = require('electron');
  const focused = BW.getFocusedWindow();
  if (focused && focused !== mainWindow) {
    focused.webContents.paste();
  }
}

// ── IPC ──
function setupIPC() {
  // Clipboard
  ipcMain.handle('clipboard:getHistory', () => history);
  ipcMain.handle('clipboard:clearHistory', () => {
    history = [];
    lastClipboardContent = '';
    saveHistory();
    notifyUpdate();
  });
  ipcMain.handle('clipboard:deleteEntry', (_, id) => {
    history = history.filter(e => e.id !== id);
    saveHistory();
    notifyUpdate();
  });
  ipcMain.handle('clipboard:toggleFavorite', (_, id) => {
    const entry = history.find(e => e.id === id);
    if (entry) {
      entry.favorite = !entry.favorite;
      saveHistory();
      notifyUpdate();
    }
  });
  ipcMain.handle('clipboard:copyToClipboard', (_, content) => {
    elClipboard.writeText(content);
  });
  ipcMain.handle('clipboard:pasteEntry', (_, content) => {
    pasteContent(content);
  });

  // Settings
  ipcMain.handle('settings:get', () => ({ ...settings }));
  ipcMain.handle('settings:update', (_, updates) => {
    settings = { ...settings, ...updates };
    saveSettings();
    if (updates.hotkey) reregisterHotkey();
    if (updates.language) {
      tray.setToolTip(settings.language === 'zh' ? '剪贴板增强' : 'Clipboard Plus');
      buildTrayMenu();
    }
    notifyUpdate();
  });

  // App
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.on('app:quit', () => { app.isQuitting = true; app.quit(); });
}

// ── App Lifecycle ──
app.whenReady().then(() => {
  loadSettings();
  loadHistory();
  createWindow();
  createTray();
  setupIPC();
  startClipboardPolling();
  reregisterHotkey();

  app.on('activate', () => {
    if (mainWindow) showWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  // Don't quit — keep tray running
});
