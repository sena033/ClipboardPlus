const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Store notes in a 'notes' directory next to the app's user data
function getNotesDir() {
  const dir = path.join(app.getPath('userData'), 'notes');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── IPC Handlers ──────────────────────────────────────────

// List all .md files (returns array of { name, title, modified })
ipcMain.handle('notes:list', () => {
  const dir = getNotesDir();
  let files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) {
        const stat = fs.statSync(path.join(dir, e.name));
        files.push({
          name: e.name,
          title: e.name.replace(/\.md$/i, ''),
          modified: stat.mtimeMs,
        });
      }
    }
  } catch (_) { /* return empty */ }
  // Sort by modified descending
  files.sort((a, b) => b.modified - a.modified);
  return files;
});

// Read a note
ipcMain.handle('notes:read', (_event, filename) => {
  const filepath = path.join(getNotesDir(), filename);
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return { ok: true, content };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Write a note
ipcMain.handle('notes:write', (_event, filename, content) => {
  const filepath = path.join(getNotesDir(), filename);
  try {
    fs.writeFileSync(filepath, content, 'utf-8');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Delete a note
ipcMain.handle('notes:delete', (_event, filename) => {
  const filepath = path.join(getNotesDir(), filename);
  try {
    fs.unlinkSync(filepath);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Rename a note
ipcMain.handle('notes:rename', (_event, oldName, newName) => {
  const dir = getNotesDir();
  try {
    fs.renameSync(path.join(dir, oldName), path.join(dir, newName));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Create a new note
ipcMain.handle('notes:create', (_event, title) => {
  const filename = title.endsWith('.md') ? title : title + '.md';
  const filepath = path.join(getNotesDir(), filename);
  if (fs.existsSync(filepath)) {
    return { ok: false, error: 'Note already exists' };
  }
  try {
    fs.writeFileSync(filepath, `# ${title}\n\n`, 'utf-8');
    return { ok: true, name: filename };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Full-text search across notes
ipcMain.handle('notes:search', (_event, query) => {
  const dir = getNotesDir();
  const results = [];
  if (!query || !query.trim()) return results;
  const lower = query.toLowerCase();
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (!(e.isFile() && e.name.endsWith('.md'))) continue;
      try {
        const content = fs.readFileSync(path.join(dir, e.name), 'utf-8');
        if (content.toLowerCase().includes(lower)) {
          // Find context snippet
          const idx = content.toLowerCase().indexOf(lower);
          const start = Math.max(0, idx - 40);
          const end = Math.min(content.length, idx + query.length + 40);
          let snippet = content.slice(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < content.length) snippet += '...';
          results.push({
            name: e.name,
            title: e.name.replace(/\.md$/i, ''),
            snippet,
          });
        }
      } catch (_) { /* skip unreadable */ }
    }
  } catch (_) { /* no dir */ }
  return results;
});

// ── Window ────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // cleaner look on macOS
    show: false,
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
