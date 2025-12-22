# Sidenote2Obsidian

<div align="center">

![Sidenote2Obsidian](assets/icon.png)

**Capture ideas, bookmarks, and reading notes directly from Chrome to Obsidian.**

[English](#english) | [简体中文](#简体中文) | [日本語](#日本語)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)](package.json)

### 🔥 What's New in v2.2.0
- **Improved Save UX**: New Toast notifications confirm when a note is successfully saved to local storage.
- **Disconnected Insights**: The disconnected page now shows a count of unsynced drafts and a "View Drafts" button.
- **Critical Fix**: Resolved a serious bug where notes could be lost when saving while Obsidian was closed.
- **Duplicate Prevention**: Improved sync logic with Unique ID (UUID) and smart file checking to prevent duplicate notes.
- **Better UX**: Title input auto-focuses on open.
- **Robustness**: Improved network error handling during sync.

</div>

---

<a name="english"></a>
## 🇬🇧 English

**Sidenote2Obsidian** is a powerful Chrome extension designed to streamline your knowledge capture workflow. It sits conveniently in your browser's side panel, allowing you to jot down thoughts, save bookmarks, or draft reading notes without leaving the page you are viewing. All your notes are synced directly to your Obsidian vault via the Local REST API.

### ✨ Features

- **Sidebar Integration**: Opens alongside your web content for seamless note-taking.
- **Rich Templates**: Comes with built-in templates (Quick Note, Bookmark, Quote, Idea, Reading) and supports custom templates.
- **Offline Support**: Drafts are saved locally first. Work offline and sync when Obsidian is ready.
- **Automatic Sync**: Option to automatically sync saved drafts to Obsidian in the background.
- **Smart Context**: Automatically grabs the page title, URL, and selected text directly into your note.
- **Multi-language**: Fully localized interface and templates in English, Chinese, and Japanese.

### 🚀 Getting Started

#### 1. Prepare Obsidian
1. Install the **[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)** plugin from the Obsidian Community Plugins list.
2. Enable the plugin.
3. Go to the plugin settings and look for your **API Key**. Copy it.
   * *Note: Ensure you are using HTTPS or HTTP as configured (default is HTTP/127.0.0.1:27123).*

#### 2. Configure Extension
1. Open the Sidenote2Obsidian extension (click the icon or use `Ctrl+Shift+O` / `Cmd+Shift+O`).
2. Go to **Settings**.
3. Paste your **API Key**.
4. (Optional) Set a **Save Path** (e.g., `Inbox/Web`). If connected, it will auto-suggest folders from your vault.

### ⌨️ Shortcuts

- **Toggle Side Panel**: `Cmd/Ctrl + Shift + O` (Chrome Global)
- **New Note**: `Cmd/Ctrl + N`
- **Toggle Preview**: `Cmd/Ctrl + E`
- **Save Draft**: `Cmd/Ctrl + Enter`

---

<a name="简体中文"></a>
## 🇨🇳 简体中文

**Sidenote2Obsidian** 是一款专为 Obsidian 用户设计的 Chrome 扩展，旨在优化您的知识捕获流程。它驻留在浏览器的侧边栏中，让您无需离开当前页面即可快速记录想法、保存书签或撰写阅读笔记。所有笔记都通过 Local REST API 直接同步到您的 Obsidian 库中。

### ✨ 主要功能

- **侧边栏集成**：与网页内容并排显示，实现无缝笔记体验。
- **丰富模板**：内置多种模板（快速笔记、书签、摘录、灵感、阅读笔记），并支持自定义。
- **离线支持**：草稿优先本地保存。即使 Obsidian 未打开也能记录，稍后一键同步。
- **自动同步**：支持后台自动将草稿同步到 Obsidian。
- **智能上下文**：自动获取当前页面的标题、链接和选中的文本填充到模板中。
- **多语言支持**：界面与模板全面支持简体中文、英语和日语。

### 🚀 快速开始

#### 1. 配置 Obsidian
1. 在 Obsidian 社区插件市场中搜索并安装 **[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)** 插件。
2. 启用该插件。
3. 进入插件设置页面，找到 **API Key** 并复制。
   * *注意：请确保您使用的是 HTTP 协议（默认地址 http://127.0.0.1:27123）。*

#### 2. 配置扩展
1. 打开 Sidenote2Obsidian 扩展（点击图标或使用快捷键）。
2. 进入 **设置 (Settings)** 页面。
3. 粘贴您的 **API Key**。
4. （可选）设置 **保存路径**（例如 `Inbox/Web`）。连接成功后，扩展会自动联想您库中的文件夹。

### ⌨️ 快捷键

- **打开侧边栏**：`Cmd/Ctrl + Shift + O` (Chrome 全局)
- **新建笔记**：`Cmd/Ctrl + N`
- **切换预览**：`Cmd/Ctrl + E`
- **保存草稿**：`Cmd/Ctrl + Enter`

---

<a name="日本語"></a>
## 🇯🇵 日本語

**Sidenote2Obsidian** は、ウェブ閲覧中の知識収集を効率化するために設計された強力なChrome拡張機能です。ブラウザのサイドパネルに常駐し、ページを離れることなくアイデアのメモ、ブックマークの保存、読書メモの作成が可能です。すべてのメモは Local REST API を介して Obsidian ボルトに直接同期されます。

### ✨ 特徴

- **サイドバー統合**: ウェブコンテンツの横でシームレスにメモを作成できます。
- **豊富なテンプレート**: 組み込みテンプレート（クイックメモ、ブックマーク、引用、アイデア、読書メモ）に加え、カスタムテンプレートもサポート。
- **オフラインサポート**: 下書きはローカルに保存されます。Obsidianが起動していなくても記録でき、後で同期可能です。
- **自動同期**: バックグラウンドでObsidianに自動同期するオプションがあります。
- **スマートコンテキスト**: 閲覧中のページのタイトル、URL、選択テキストを自動的に取得します。
- **多言語対応**: インターフェースとテンプレートは日本語、英語、中国語に完全対応しています。

### 🚀 始め方

#### 1. Obsidianの準備
1. Obsidianのコミュニティプラグインから **[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)** をインストールします。
2. プラグインを有効にします。
3. 設定画面で **API Key** を見つけてコピーします。

#### 2. 拡張機能の設定
1. Sidenote2Obsidianを開きます。
2. **設定 (Settings)** に移動します。
3. **API Key** を貼り付けます。
4. （オプション）**保存パス**（例：`Inbox/Web`）を設定します。

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
