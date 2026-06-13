# Clipboard Plus

> Windows clipboard history manager

**[中文](README.zh.md)** | **English (current)**

Clipboard Plus is an Electron-based Windows clipboard history manager with a Ditto-style UI, supporting both Chinese and English.

## Features
| Feature | Description |
|---------|-------------|
| 📋 Clipboard History | Auto-record copied content (text) |
| 🔍 Quick Search | Real-time search through history |
| ⭐ Favorites | Pin frequently used entries |
| 🎨 Custom Themes | Custom accent color, background, wallpaper |
| ⌨️ Global Hotkey | Default `Alt+V`, customizable in settings |
| 📍 Popup Position | Cursor / Center / Custom position |
| 🌐 Bilingual UI | Switch between 中文 and English |
| 🖥️ System Tray | Runs in background, tray icon + hotkey |

## Download
Get the latest `Clipboard-Plus-*.exe` installer from [GitHub Releases](https://github.com/sena033/ClipboardPlus/releases).

## Development
```bash
cd clipboard-plus
npm install
npm run dev          # Dev mode (Vite + Electron HMR)
npm run dist:win     # Package as Windows installer
```

---

## Other Projects in this Repo
- `src/` — C example projects using raylib (build with CMake + MinGW)
