console.log("Content script loaded");

if (!window.hasContentScriptLoaded) {
  window.hasContentScriptLoaded = true;

  const ball = document.createElement('div');
  ball.id = 'floating-ball';
  const ballImageUrl = chrome.runtime.getURL('images/ball.png');
  ball.style.cssText = `
    position: fixed;
    bottom: 20px;
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

  const inputBox = document.createElement('div');
  inputBox.id = 'input-box';
  inputBox.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 300px;
    padding: 10px;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    display: none;
    z-index: 1000;
    border: 1px solid #ccc;
    border-radius: 5px;
  `;
  inputBox.innerHTML = `    
    <label for="note-title" style="font-weight: bold;">Note Title (optional):</label>
    <input type="text" id="note-title" style="width: 100%; margin-bottom: 10px; border: 1px solid #ccc; padding: 5px;">
    <label for="note-content" style="font-weight: bold;">Note Content:</label>
    <textarea id="note-content" rows="10" style="width: 100%; border: 1px solid #ccc; padding: 5px;"></textarea>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
    <button id="save-note">Save</button>
    <p style="font-size: 12px; color: #888; margin: 0;">Cmd+Enter to submit, ESC to exit</p>
  </div>
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
          document.getElementById('note-title').focus();
        }
        console.log("Input box toggled");
      });
    });
  });

  let isSaving = false;

  const saveButton = document.getElementById('save-note');
  saveButton.addEventListener('click', saveNoteHandler);

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
    const shortcutKey = result.shortcutKey || 'Ctrl+O';
  
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
            document.getElementById('note-title').focus();
          }
        });
      });
    });
  });
  

}
