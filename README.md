### 简介
一个简单的 Chrome 插件，快速在任何网页记录想法并发送到 Obsidian。
需要搭配社区插件使用：[Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) 以通过安全的Local REST API 进行笔记的自动化处理。

<img width="1571" alt="image" src="https://github.com/moyuguy/sidenote2obsidian/assets/5793687/0fcb66cb-5311-4671-a5f1-0e58575ed253">


### 安装方式
1. 在 Obsidian 社区插件中安装 Local REST API。
2. 下载本插件到本地并解压，建议将文件夹放置在一个不会随意删除的位置。
3. 在 Chrome 地址栏输入 `chrome://extensions/` 进入扩展程序管理页面，右上角打开开发者模式。
4. 加载已解压的扩展程序，选择刚才解压好的文件夹。

### 使用方式
1. 点击插件按钮，弹出对话框填写 Obsidian APP 中 Local REST API 插件设置页的 API Key。
2. 设置笔记保存路径，留空则保存到根目录。
3. 设置完成后，在 Obsidian APP 保持打开的情况下，点击小球即可开始写笔记。
4. 笔记文件名默认是 yyyyMMddhhmm{noteTitle}.md，暂时不支持自定义。不填笔记标题时，文件名为yyyyMMddhhmm.md。

---

### Introduction
A simple Chrome extension for quickly recording ideas on any webpage and sending them to Obsidian.
Requires the community plugin [Obsidian Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) to interact with your notes in Obsidian over a secure REST API.

### Installation
1. Install the Local REST API plugin from the Obsidian community plugins.
2. Download and unzip this extension to a preferred location on your computer. Make sure not to delete this folder.
3. Enter `chrome://extensions/` in the Chrome address bar to open the extensions management page and enable Developer mode in the top right corner.
4. Load the unpacked extension and select the folder you just unzipped.

### Usage
1. Click the extension button to open the dialog box and enter the API Key from the Local REST API plugin settings page in the Obsidian APP.
2. Set the note save path. Leave it empty to save in the root directory.
3. Once set up, with the Obsidian APP open, click the floating ball to start writing notes.
4. Note The default file name is yyyyMMddhhmm{noteTitle}.md. User-defined file name is not supported. If the note title is not specified, the file name is yyyyMMddhhmm.md.
