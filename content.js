console.log("Content script loaded");

if (!window.hasContentScriptLoaded) {
  window.hasContentScriptLoaded = true;

  // 创建悬浮球
  const ball = document.createElement('div');
  ball.id = 'floating-ball';
  const ballImageUrl = chrome.runtime.getURL('images/ball.png');
  ball.style.cssText = `
    position: fixed;
    bottom: 350px;
    right: 20px;
    width: 50px;
    height: 50px;
    background-image: url('${ballImageUrl}');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
  `;
  document.body.appendChild(ball);
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
  inputBox.style.cssText = `
    position: fixed;
    width: 300px;
    padding: 10px;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: none;
    z-index: 1000;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;  /* 确保padding不影响元素总宽度 */
  `;
  inputBox.innerHTML = `    
    <label for="note-title" style="font-weight: bold;">Note Title (optional):</label>
    <input type="text" id="note-title" style="width: 100%; margin-bottom: 10px; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;">
    <label for="note-content" style="font-weight: bold;">Note Content:</label>
    <textarea id="note-content" rows="10" style="width: 100%; border: 1px solid #ccc; padding: 5px; box-sizing: border-box;"></textarea>
    <button id="save-note">Save</button>
    <button id="clear-note" style="background-color: white; border: 0 red; color: red;">Clear</button>
    <p style="font-size: 12px; color: #888; margin: 0;">Cmd+Enter to submit, ESC to exit</p>
  `;
  document.body.appendChild(inputBox);
  console.log("Input box created");

  ball.addEventListener('click', function() {
    chrome.storage.sync.get(['apiKey', 'savePath'], (result) => {
      const apiKey = result.apiKey;
      let savePath = result.savePath;
      
      checkServerAndApiKey(apiKey, () => {
        inputBox.style.display = inputBox.style.display === 'none' ? 'block' : 'none';
        if (inputBox.style.display === 'block') {
          updateInputBoxPosition();
          document.getElementById('note-title').focus();
        }
        console.log("Input box toggled");
      });
    });
  });

  let isSaving = false;

  const saveButton = document.getElementById('save-note');
  saveButton.addEventListener('click', saveNoteHandler);

  const clearButton = document.getElementById('clear-note');
  clearButton.addEventListener('click', function() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
  });

  // cmd+enter 提交
  document.getElementById('note-content').addEventListener('keydown', function(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      saveNoteHandler();
    }
  });

  // 按下esc隐藏窗口
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && (document.activeElement === document.getElementById('note-title') || document.activeElement === document.getElementById('note-content'))) {
      inputBox.style.display = 'none';
    }
  });
  

  function saveNoteHandler() {
    if (isSaving) return;

    const noteTitle = document.getElementById('note-title').value.trim();
    const noteContent = document.getElementById('note-content').value;
    if (!noteContent) {
      showBubble('Please enter note content.');
      return;
    }

    isSaving = true;

    chrome.storage.sync.get(['apiKey', 'savePath'], (result) => {
      if (!result.apiKey) {
        showBubble('API Key or Save Path not set. Please set it in the extension options.');
        isSaving = false;
        return;
      }

      let savePath = result.savePath;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formattedDate = `${year}${month}${day}${hours}${minutes}`;

      const filename = savePath ? 
        `${savePath}/${noteTitle ? formattedDate + ' ' + noteTitle : formattedDate}.md` : 
        `${formattedDate}${noteTitle ? ' ' + noteTitle : ''}.md`;

      fetch(`https://127.0.0.1:27124/vault/${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/markdown',
          'Authorization': `Bearer ${result.apiKey}`
        },
        body: noteContent
      }).then(response => {
        isSaving = false;
        if (response.ok) {
          showBubble('Note saved!');
          inputBox.style.display = 'none';
          document.getElementById('note-title').value = '';
          document.getElementById('note-content').value = '';
        } else {
          response.text().then(text => {
            console.error('Response text:', text);
            showBubble('Failed to save note.');
          });
        }
      }).catch(error => {
        isSaving = false;
        console.error('Error:', error);
        showBubble('Error: ' + error.message);
      });
    });
  }

  document.addEventListener('click', function(event) {
    if (!inputBox.contains(event.target) && !ball.contains(event.target)) {
      inputBox.style.display = 'none';
    }
  });

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
    document.body.appendChild(modal);

    document.getElementById('cancel-button').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('open-obsidian-button').addEventListener('click', () => {
      window.location.href = 'obsidian://';
      document.body.removeChild(modal);
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
      chrome.storage.sync.get(['apiKey'], (result) => {
        if (!result.apiKey) {
          showBubble('Please set the API key first.');
          return;
        }
  
        checkServerAndApiKey(result.apiKey, () => {
          inputBox.style.display = inputBox.style.display === 'none' ? 'block' : 'none';
          if (inputBox.style.display === 'block') {
            updateInputBoxPosition();
            document.getElementById('note-title').focus();
          }
        });
      });
    });
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
