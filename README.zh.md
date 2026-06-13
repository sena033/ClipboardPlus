# 剪贴板增强 - Clipboard Plus

> Windows 剪贴板历史管理器

[English](README.md) | **中文 (当前)**

剪贴板增强（Clipboard Plus）是一个基于 Electron 的 Windows 剪贴板历史管理工具，仿 Ditto 风格界面，支持中英文。

## 功能
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

## 下载
从 [GitHub Releases](https://github.com/sena033/ClipboardPlus/releases) 下载最新的 `Clipboard-Plus-*.exe` 安装程序，运行即可。

## 开发
```bash
cd clipboard-plus
npm install
npm run dev          # 开发模式（Vite + Electron）
npm run dist:win     # 打包为 Windows 安装程序
```

---

## 仓库其他项目
- `src/` — 使用 raylib 的 C 语言示例项目（CMake + MinGW 构建）
