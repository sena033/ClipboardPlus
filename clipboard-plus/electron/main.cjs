const {
  app, BrowserWindow, globalShortcut, Tray, Menu,
  clipboard: elClipboard, nativeImage, ipcMain, screen, dialog,
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

const DEFAULT_SETTINGS = {
  hotkey: 'Alt+V',
  language: 'zh',
  maxHistory: 100,
  popupPosition: 'cursor',
  popupX: 200,
  popupY: 100,
  accentColor: '#89b4fa',
  bgColor: '#1e1e2e',
  wallpaperPath: '',
  theme: 'dark',
  wallpaperFit: 'cover',
  enabledGroups: ['all', 'favorites', 'today', 'yesterday', 'week', 'month', 'older', 'archived'],
  groupLabels: {},
  autoPaste: false,
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
  try { fs.writeFileSync(HISTORY_FILE, JSON.stringify(history), 'utf-8'); }
  catch (e) { /* ignore */ }
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

  history.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type, content,
    timestamp: Date.now(),
    favorite: false,
    archived: false,
  });
  pruneHistory();
  saveHistory();
  notifyUpdate();
}

function notifyUpdate() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('clipboard-update', history);
  }
}

// ── Clipboard Polling ──
function startClipboardPolling() {
  try {
    const initialText = elClipboard.readText();
    if (initialText) lastClipboardContent = initialText;
  } catch (_) {}

  setInterval(() => {
    try {
      const text = elClipboard.readText();
      if (text && text !== lastClipboardContent) addEntry('text', text);
    } catch (_) { /* ignore */ }
  }, 500);
}

// ── Hotkey ──
function registerHotkey(hotkey) {
  globalShortcut.unregisterAll();
  const key = hotkey || DEFAULT_SETTINGS.hotkey;
  const handler = () => toggleWindow();

  try {
    const ok = globalShortcut.register(key, handler);
    if (!ok) {
      console.warn(`[clipboard-plus] Hotkey "${key}" failed`);
    }
  } catch (e) {
    console.error(`[clipboard-plus] Hotkey error:`, e);
  }
}

function reregisterHotkey() { registerHotkey(settings.hotkey); }

// ── Window Position ──
function calcWindowPos() {
  const winsize = mainWindow.getSize();
  const winw = winsize[0], winh = winsize[1];
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const workArea = primary.workArea;

  switch (settings.popupPosition) {
    case 'cursor': {
      const cursor = screen.getCursorScreenPoint();
      let x = cursor.x - Math.round(winw / 2);
      let y = cursor.y - 20;
      // Clamp to work area
      x = Math.max(workArea.x, Math.min(x, workArea.x + workArea.width - winw));
      y = Math.max(workArea.y, Math.min(y, workArea.y + workArea.height - winh));
      return { x, y };
    }
    case 'custom':
      return { x: settings.popupX, y: settings.popupY };
    case 'center':
    default:
      return {
        x: workArea.x + Math.round((workArea.width - winw) / 2),
        y: workArea.y + Math.round((workArea.height - winh) / 2),
      };
  }
}

// ── Tray ──
function createTray() {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (x >= 2 && x <= 13 && y >= 2 && y <= 13) {
        if (x === 2 || x === 13 || y === 2 || y === 13) {
          canvas[idx] = 137; canvas[idx+1] = 180; canvas[idx+2] = 250; canvas[idx+3] = 255;
        } else {
          canvas[idx] = 30; canvas[idx+1] = 30; canvas[idx+2] = 46; canvas[idx+3] = 0;
        }
      } else {
        canvas[idx] = 0; canvas[idx+1] = 0; canvas[idx+2] = 0; canvas[idx+3] = 0;
      }
    }
  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });
  tray = new Tray(icon);
  tray.setToolTip(settings.language === 'zh' ? '剪贴板增强' : 'Clipboard Plus');
  buildTrayMenu();
  tray.on('click', () => toggleWindow());
}

// ── Show Window (always show, no toggle) ──
function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isVisible()) return;
  const pos = calcWindowPos();
  mainWindow.setPosition(pos.x, pos.y);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('clipboard-update', history);
}

// ── Application Menu ──
function createAppMenu() {
  const isZh = settings.language === 'zh';
  const template = [
    {
      label: isZh ? '文件' : 'File',
      submenu: [
        { label: isZh ? '设置' : 'Settings', accelerator: 'Ctrl+,', click: () => { try { mainWindow?.webContents.send('open-settings'); } catch (_) {} showWindow(); } },
        { type: 'separator' },
        { label: isZh ? '退出' : 'Quit', accelerator: 'Alt+F4', click: () => { app.isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: isZh ? '编辑' : 'Edit',
      submenu: [
        { role: 'undo', label: isZh ? '撤销' : 'Undo' },
        { role: 'redo', label: isZh ? '重做' : 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: isZh ? '剪切' : 'Cut' },
        { role: 'copy', label: isZh ? '复制' : 'Copy' },
        { role: 'paste', label: isZh ? '粘贴' : 'Paste' },
        { role: 'selectAll', label: isZh ? '全选' : 'Select All' },
      ],
    },
    {
      label: isZh ? '视图' : 'View',
      submenu: [
        { label: isZh ? '显示剪贴板' : 'Show Clipboard', accelerator: settings.hotkey, click: () => toggleWindow() },
        { type: 'separator' },
        { role: 'toggleDevTools', label: isZh ? '开发者工具' : 'Toggle DevTools' },
        { role: 'reload', label: isZh ? '重新加载' : 'Reload' },
      ],
    },
    {
      label: isZh ? '帮助' : 'Help',
      submenu: [
        {
          label: isZh ? '关于剪贴板增强' : 'About Clipboard Plus',
          click: () => {
            const v = app.getVersion();
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: isZh ? '关于' : 'About',
              message: isZh ? `剪贴板增强 v${v}` : `Clipboard Plus v${v}`,
              detail: isZh ? '基于 Electron 的 Windows 剪贴板历史管理器' : 'Electron-based Windows clipboard history manager',
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function buildTrayMenu() {
  const isZh = settings.language === 'zh';
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: isZh ? '显示剪贴板' : 'Show Clipboard', click: () => toggleWindow() },
    { type: 'separator' },
    { label: isZh ? '设置' : 'Settings', click: () => { mainWindow?.webContents.send('open-settings'); toggleWindow(); } },
    { type: 'separator' },
    { label: isZh ? '退出' : 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]));
}

// ── Window ──
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 680, height: 500,
    resizable: true, frame: true,
    backgroundColor: settings.bgColor,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide(); }
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    return;
  }
  // Set position before showing
  const pos = calcWindowPos();
  mainWindow.setPosition(pos.x, pos.y);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send('clipboard-update', history);
}

// ── Paste ──
function pasteContent(content) {
  elClipboard.writeText(content);
  const focused = BrowserWindow.getFocusedWindow();
  if (focused && focused !== mainWindow) focused.webContents.paste();
}

// ── IPC ──
function setupIPC() {
  // Clipboard
  ipcMain.handle('clipboard:getHistory', () => history);
  ipcMain.handle('clipboard:clearHistory', () => {
    history = []; lastClipboardContent = ''; saveHistory(); notifyUpdate();
  });
  ipcMain.handle('clipboard:deleteEntry', (_, id) => {
    history = history.filter(e => e.id !== id); saveHistory(); notifyUpdate();
  });
  ipcMain.handle('clipboard:deleteEntries', (_, ids) => {
    history = history.filter(e => !ids.includes(e.id)); saveHistory(); notifyUpdate();
  });
  ipcMain.handle('clipboard:toggleFavorite', (_, id) => {
    const entry = history.find(e => e.id === id);
    if (entry) { entry.favorite = !entry.favorite; saveHistory(); notifyUpdate(); }
  });
  ipcMain.handle('clipboard:toggleArchive', (_, id) => {
    const entry = history.find(e => e.id === id);
    if (entry) { entry.archived = !entry.archived; saveHistory(); notifyUpdate(); }
  });
  ipcMain.handle('clipboard:copyToClipboard', (_, content) => elClipboard.writeText(content));
  ipcMain.handle('clipboard:pasteEntry', (_, content) => pasteContent(content));

  // Settings
  ipcMain.handle('settings:get', () => ({ ...settings }));
  ipcMain.handle('settings:update', (_, updates) => {
    settings = { ...settings, ...updates };
    saveSettings();
    if (updates.hotkey) reregisterHotkey();
    if (updates.language) {
      tray.setToolTip(settings.language === 'zh' ? '剪贴板增强' : 'Clipboard Plus');
      buildTrayMenu();
      createAppMenu();
    }
    if (updates.bgColor && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(settings.bgColor);
    }
  });

  // Position picker — return current window position
  ipcMain.handle('settings:pickPosition', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return { x: 200, y: 100 };
    const [x, y] = mainWindow.getPosition();
    return { x, y };
  });

  // Dialog
  ipcMain.handle('dialog:selectWallpaper', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: settings.language === 'zh' ? '选择壁纸图片' : 'Select Wallpaper Image',
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp'] }],
      properties: ['openFile'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    // Copy to app userData folder for persistence
    const dest = path.join(app.getPath('userData'), 'wallpaper' + path.extname(filePath));
    try {
      fs.copyFileSync(filePath, dest);
      return dest;
    } catch (_) { return filePath; }
  });

  // App
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.on('app:quit', () => { app.isQuitting = true; app.quit(); });
  ipcMain.on('app:hide', () => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide(); });
}

// ── App Lifecycle ──
app.whenReady().then(() => {
  loadSettings();
  loadHistory();
  createWindow();
  createAppMenu();
  createTray();
  setupIPC();
  startClipboardPolling();
  reregisterHotkey();
  app.on('activate', () => toggleWindow());
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => { /* keep tray */ });
