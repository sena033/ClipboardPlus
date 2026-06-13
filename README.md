# Clipboard Plus / 剪贴板增强

> Windows 剪贴板历史管理器 | Windows clipboard history manager

## 中文

剪贴板增强是一个基于 Electron 的 Windows 剪贴板历史管理工具，仿 Ditto 风格界面，支持中英文。

### 功能
| 功能 | 说明 |
|------|------|
| 📋 剪贴板历史 | 自动记录复制的内容，支持文本 |
| 🔍 快速搜索 | 在历史记录中实时搜索 |
| ⭐ 收藏夹 | 收藏常用条目，快速查找 |
| 🎨 自定义主题 | 可自定义强调色、背景色、壁纸 |
| ⌨️ 全局快捷键 | 默认 `Alt+V` 呼出，可在设置中自定义 |
| 📍 弹出位置 | 可选光标处 / 屏幕居中 / 自定义位置 |
| 🌐 双语界面 | 中文 / English 界面切换 |
| 🖥️ 系统托盘 | 后台常驻，点击托盘图标或按快捷键呼出 |

### 下载
从 [GitHub Releases](https://github.com/sena033/ClipboardPlus/releases) 下载最新 `clipboard-plus-windows` 构建产物，运行安装程序即可。

### 开发
```bash
cd clipboard-plus
npm install
npm run dev          # 开发模式（Vite + Electron）
npm run dist:win     # 打包为 Windows 安装程序
```

---

## English

Clipboard Plus is an Electron-based Windows clipboard history manager with a Ditto-style UI, supporting both Chinese and English.

### Features
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

### Download
Get the latest `clipboard-plus-windows` build artifact from [GitHub Releases](https://github.com/sena033/ClipboardPlus/releases).

### Development
```bash
cd clipboard-plus
npm install
npm run dev          # Dev mode (Vite + Electron HMR)
npm run dist:win     # Package as Windows installer
```

---

## Other Projects in this Repo

- `src/` — C example projects using raylib (build with CMake + MinGW)
