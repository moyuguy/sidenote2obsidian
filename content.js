if (window.hasContentScriptLoaded) {
  console.log("Content script already loaded. Skipping initialization.");
} else {
  window.hasContentScriptLoaded = true;

  console.log("Content script loaded");

  // 创建一个容器元素
  const container = document.createElement('div');
  container.id = 'my-extension-container';
  document.body.appendChild(container);

  // 创建Shadow DOM
  const shadow = container.attachShadow({mode: 'open'});
  const shadowRoot = shadow.getRootNode();

  shadowRoot.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      inputBox.style.display = 'none';
    }
  });

  // 创建样式元素
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
    }
    #floating-ball {
      position: fixed;
      bottom: 350px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
      border-radius: 50%;
      cursor: pointer;
      z-index: 2147483647;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }
    #input-box {
      position: fixed;
      width: 300px;
      padding: 10px;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      display: none;
      z-index: 2147483647;
      border: 1px solid #ccc;
      border-radius: 5px;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
      font-size: 14px;
    }
    #input-box label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }
    #input-box input,
    #input-box textarea {
      width: 100%;
      margin-bottom: 10px;
      border: 1px solid #ccc;
      padding: 5px;
      box-sizing: border-box;
      font-family: inherit;
      font-size: inherit;
    }
    #input-box input:focus,
    #input-box textarea:focus {
      outline: none;
      border-color: rgb(124 58 237);
      box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
    }
    #input-box button {
      padding: 8px 15px;
      margin-right: 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s, color 0.3s;
      height: 36px; // 确保所有按钮高度一致
      line-height: 20px; // 调整行高以确保文本垂直居中
    }
    #input-box #save-note {
      background-color: rgb(124 58 237);
      color: white;
    }
    #input-box #save-note:hover {
      background-color: rgb(109 40 217);
    }
    #input-box #clear-note {
      background-color: white;
      border: 1px solid rgb(124 58 237);
      color: rgb(124 58 237);
      box-sizing: border-box; // 确保边框不会增加按钮的总高度
    }
    #input-box #clear-note:hover {
      background-color: rgb(124 58 237);
      color: white;
    }
    #input-box p {
      font-size: 12px;
      color: #888;
      margin: 5px 0 0;
    }
  `;
  shadow.appendChild(style);

  // 创建悬浮球
  const ball = document.createElement('div');
  ball.id = 'floating-ball';
  const ballImageUrl = chrome.runtime.getURL('images/ball.png');
  ball.style.backgroundImage = `url('${ballImageUrl}')`;
  shadow.appendChild(ball);
  console.log("Floating ball created");

  // 悬浮球添加拖动功能
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  ball.addEventListener('mousedown', (event) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialLeft = ball.offsetLeft;
    initialTop = ball.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(event) {
    if (!isDragging) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    ball.style.left = `${initialLeft + deltaX}px`;
    ball.style.top = `${initialTop + deltaY}px`;
  
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    // 设置输入框的位置
    let inputBoxLeft = ball.offsetLeft;
    let inputBoxTop = ball.offsetTop + ball.offsetHeight;
  
    // 确保输入框不会超出视口右边界
    if (inputBoxLeft + inputBox.offsetWidth > viewportWidth) {
      inputBoxLeft = viewportWidth - inputBox.offsetWidth;
    }
  
    // 确保输入框不会超出视口底部
    if (inputBoxTop + inputBox.offsetHeight > viewportHeight) {
      inputBoxTop = viewportHeight - inputBox.offsetHeight;
    }
  
    inputBox.style.left = `${inputBoxLeft}px`;
    inputBox.style.top = `${inputBoxTop}px`;
  }

  function onMouseUp(event) {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const viewportWidth = window.innerWidth;
    const ballCenter = ball.offsetLeft + ball.offsetWidth / 2;
    if (ballCenter < viewportWidth / 2) {
      ball.style.left = '10px';
      ball.style.right = 'auto';
    } else {
      ball.style.left = 'auto';
      ball.style.right = '10px';
    }
  }

  const inputBox = document.createElement('div');
  inputBox.id = 'input-box';
  inputBox.tabIndex = -1; // 添加这行
  inputBox.style.display = 'none'; 
  inputBox.innerHTML = `    
    <label for="note-title">Note Title (optional):</label>
    <input type="text" id="note-title">
    <label for="note-content">Note Content:</label>
    <textarea id="note-content" rows="10"></textarea>
    <button id="save-note">Save</button>
    <button id="clear-note">Clear</button>
    <p>Cmd+Enter to submit, ESC to exit</p>
  `;
  shadow.appendChild(inputBox);
  console.log("Input box created");

  // 以下处理视频网站快捷键冲突
  const noteTitle = shadow.getElementById('note-title');
  const noteContent = shadow.getElementById('note-content');

  // 创建陷阱元素
  const trapElement = document.createElement('div');
  trapElement.style.position = 'fixed';
  trapElement.style.top = '0';
  trapElement.style.left = '0';
  trapElement.style.width = '100%';
  trapElement.style.height = '100%';
  trapElement.style.zIndex = '2147483647'; // 最高的z-index
  trapElement.style.display = 'none';
  trapElement.style.pointerEvents = 'none'; // 允许点击穿透
  shadow.appendChild(trapElement);

  function activateTrap() {
    trapElement.style.display = 'block';
  }

  function deactivateTrap() {
    trapElement.style.display = 'none';
  }

  function handleKeyDown(event) {
    // 处理 Cmd+Enter
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      saveNoteHandler(); // 调用保存笔记的函数
      return;
    }

    // 处理 Esc
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      inputBox.style.display = 'none'; // 隐藏输入框
      deactivateTrap(); // 停用陷阱
      return;
    }

    // 对于其他键，阻止事件传播到页面的其他部分
    if (event.key !== ' ') {  // 除了空格键
      event.stopPropagation();
    }
  }

  // 为陷阱元素添加事件监听器
  trapElement.addEventListener('keydown', handleKeyDown, true);

  // 当输入框获得焦点时激活陷阱
  noteTitle.addEventListener('focus', activateTrap);
  noteContent.addEventListener('focus', activateTrap);

  // 当输入框失去焦点时停用陷阱
  noteTitle.addEventListener('blur', deactivateTrap);
  noteContent.addEventListener('blur', deactivateTrap);

  // 为输入框单独添加空格键和Cmd+Enter处理
  function handleInputKeyDown(event) {
    if (event.key === ' ') {
      event.stopPropagation();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      saveNoteHandler(); // 调用保存笔记的函数
    }
  }

  noteTitle.addEventListener('keydown', handleInputKeyDown, true);
  noteContent.addEventListener('keydown', handleInputKeyDown, true);

  // 确保点击输入框不会使陷阱失效
  inputBox.addEventListener('mousedown', function(event) {
    event.stopPropagation();
  });

  loadSavedNote(); // 加载保存的笔记内容

  // 使用 click 事件来处理输入框的显示和隐藏
  document.addEventListener('click', function(event) {
    if (!shadowRoot.contains(event.target) && !inputBox.contains(event.target) && !ball.contains(event.target)) {
      inputBox.style.display = 'none';
    }
  });

  ball.addEventListener('click', function(event) {
    event.stopPropagation(); // 阻止事件冒泡
    chrome.storage.sync.get(['apiKey', 'savePath'], (result) => {
      const apiKey = result.apiKey;
      let savePath = result.savePath;
      
      checkServerAndApiKey(apiKey, () => {
        if (inputBox.style.display === 'none' || inputBox.style.display === '') {
          inputBox.style.display = 'block';
          updateInputBoxPosition();
          loadSavedNote(); // 加载保存的笔记内容
          shadow.getElementById('note-title').focus();
        } else {
          inputBox.style.display = 'none';
        }
        console.log("Input box toggled, current display:", inputBox.style.display);
      });
    });
  });

  // 为输入框添加点击事件监听器，阻止事件冒泡
  inputBox.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  let isSaving = false;

  const saveButton = shadow.getElementById('save-note');
  saveButton.addEventListener('click', saveNoteHandler);

  const clearButton = shadow.getElementById('clear-note');
  clearButton.addEventListener('click', function() {
    shadow.getElementById('note-title').value = '';
    shadow.getElementById('note-content').value = '';
    chrome.storage.local.remove(['noteTitle', 'noteContent', 'lastSaved'], function() {
      console.log('Note content cleared from local storage');
    });
  });

  // cmd+enter 提交
  // shadow.getElementById('note-content').addEventListener('keydown', function(event) {
  //   if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
  //     event.preventDefault();
  //     saveNoteHandler();
  //   }
  // });

  function saveNoteHandler() {
    if (isSaving) return;
  
    const noteTitle = shadow.getElementById('note-title').value.trim();
    const noteContent = shadow.getElementById('note-content').value;
  
    if (!noteContent) {
      showBubble('Please enter note content.');
      return;
    }
  
    isSaving = true;
  
    chrome.runtime.sendMessage({action: "getCurrentTabInfo"}, function(response) {
      const pageUrl = response.url;
      const pageTitle = response.title;
  
      const sourceInfo = `\n\n> Source: [${pageTitle}](${pageUrl})`;
      const fullNoteContent = noteContent + sourceInfo;
  
      chrome.storage.sync.get(['apiKey', 'savePath'], (result) => {
        if (!result.apiKey) {
          showBubble('API Key or Save Path not set. Please set it in the extension options.');
          isSaving = false;
          return;
        }
  
        let savePath = result.savePath;
        const now = new Date();
        const formattedDate = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  
        const filename = savePath ? 
          `${savePath}/${noteTitle ? formattedDate + ' ' + noteTitle : formattedDate}.md` : 
          `${formattedDate}${noteTitle ? ' ' + noteTitle : ''}.md`;
  
        fetch(`https://127.0.0.1:27124/vault/${encodeURIComponent(filename)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/markdown',
            'Authorization': `Bearer ${result.apiKey}`
          },
          body: fullNoteContent
        }).then(response => {
          isSaving = false;
          if (response.ok) {
            showBubble('Note saved!');
            inputBox.style.display = 'none';
  
            chrome.storage.local.remove(['noteTitle', 'noteContent', 'lastSaved']);
  
            shadow.getElementById('note-title').value = '';
            shadow.getElementById('note-content').value = '';
          } else {
            response.text().then(text => {
              showBubble('Failed to save note.');
            });
          }
        }).catch(error => {
          isSaving = false;
          showBubble('Error: ' + error.message);
        });
      });
    });
  }

  function saveNoteToLocal() {
    const noteTitle = shadow.getElementById('note-title').value;
    const noteContent = shadow.getElementById('note-content').value;
    const lastSaved = new Date().getTime();
    chrome.storage.local.set({ noteTitle, noteContent, lastSaved });
  }

  function loadSavedNote() {
    chrome.storage.local.get(['noteTitle', 'noteContent', 'lastSaved'], function(result) {
      if (result.lastSaved) {
        const now = new Date().getTime();
        const timeSinceLastSave = now - result.lastSaved;
        
        if (timeSinceLastSave <= 3600000) { // 1小时 = 3600000毫秒
          shadow.getElementById('note-title').value = result.noteTitle || '';
          shadow.getElementById('note-content').value = result.noteContent || '';
        } else {
          // 如果超过1小时,清除保存的内容
          chrome.storage.local.remove(['noteTitle', 'noteContent', 'lastSaved']);
        }
      }
    });
  }

  // 在输入时保存笔记内容到本地存储
  shadow.getElementById('note-title').addEventListener('input', saveNoteToLocal);
  shadow.getElementById('note-content').addEventListener('input', saveNoteToLocal);

  
  function showBubble(message) {
    const bubble = document.createElement('div');
    bubble.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #007bff;
      color: white;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
    `;
    bubble.innerText = message;
    document.body.appendChild(bubble);
    setTimeout(() => {
      document.body.removeChild(bubble);
    }, 3000);
  }

  function checkServerAndApiKey(apiKey, callback) {
    if (!apiKey) {
      showBubble('Please set the API key first.');
      return;
    }

    fetch('https://127.0.0.1:27124')
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK') {
          callback();
        } else {
          showObsidianModal();
        }
      })
      .catch(error => {
        console.error('Error checking server status:', error);
        showObsidianModal();
      });
  }

  function showObsidianModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      width: 300px;
    `;
    modalContent.innerHTML = `
      <h2>Obsidian is not open</h2>
      <p>Please open Obsidian and ensure the Local REST API plugin is installed and configured.</p>
      <button id="cancel-button" style="margin-right: 10px; background-color: white; border: 1px solid red; color: red; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
      <button id="open-obsidian-button" style="background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Open Obsidian</button>
    `;
    modal.appendChild(modalContent);
    shadowRoot.appendChild(modal);

    modalContent.querySelector('#cancel-button').addEventListener('click', () => {
      shadowRoot.removeChild(modal);
    });
  
    modalContent.querySelector('#open-obsidian-button').addEventListener('click', () => {
      window.location.href = 'obsidian://';
      shadowRoot.removeChild(modal);
    });
  }

  chrome.storage.sync.get(['shortcutKey'], (result) => {
    const shortcutKey = result.shortcutKey || 'Ctrl+o';
  
    document.addEventListener('keydown', function(event) {
      const keys = shortcutKey.split('+');
      const key = keys.pop();
      const isCtrl = keys.includes('Ctrl');
      const isMeta = keys.includes('Meta');
      const isShift = keys.includes('Shift');
      const isAlt = keys.includes('Alt');
  
      if (
        (isCtrl && !event.ctrlKey) ||
        (isMeta && !event.metaKey) ||
        (isShift && !event.shiftKey) ||
        (isAlt && !event.altKey) ||
        event.key !== key
      ) {
        return;
      }
  
      event.preventDefault();
      event.stopPropagation();

      chrome.storage.sync.get(['apiKey'], (result) => {
        if (!result.apiKey) {
          showBubble('Please set the API key first.');
          return;
        }
  
        checkServerAndApiKey(result.apiKey, () => {
          inputBox.style.display = inputBox.style.display === 'none' ? 'block' : 'none';
          if (inputBox.style.display === 'block') {
            updateInputBoxPosition();
            shadow.getElementById('note-title').focus();
          }
        });
      });
    }, true); // 使用捕获阶段
  });

  function updateInputBoxPosition() {
    const ballRect = ball.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
  
    // 设置输入框的初始位置，增加一定的间距
    let inputBoxLeft = ballRect.left;
    let inputBoxTop = ballRect.bottom + 10; // 增加10px的垂直间距
  
    // 确保输入框不会超出视口右边界，左右边距为10px
    if (inputBoxLeft + inputBox.offsetWidth > viewportWidth - 10) {
      inputBoxLeft = viewportWidth - inputBox.offsetWidth - 10;
    }
  
    // 确保输入框不会超出视口左边界，左右边距为10px
    if (inputBoxLeft < 10) {
      inputBoxLeft = 10;
    }
  
    // 确保输入框不会超出视口底部
    if (inputBoxTop + inputBox.offsetHeight > viewportHeight) {
      inputBoxTop = ballRect.top - inputBox.offsetHeight - 10; // 在悬浮球上方显示，增加10px的垂直间距
    }
  
    // 确保输入框不会盖住悬浮球
    if (inputBoxTop < ballRect.bottom) {
      inputBoxTop = ballRect.bottom + 10; // 再次调整，确保输入框在悬浮球下方
    }
  
    inputBox.style.left = `${inputBoxLeft}px`;
    inputBox.style.top = `${inputBoxTop}px`;
  }  
}