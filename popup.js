document.getElementById('save').addEventListener('click', () => {
  const apiKey = document.getElementById('api-key').value;
  let savePath = document.getElementById('save-path').value.trim();
  const shortcutKey = document.getElementById('shortcut-key').value.trim();
  const errorMessage = document.getElementById('error-message');

  if (!apiKey) {
    errorMessage.textContent = 'API Key is required.';
    return;
  }

  if (savePath === "/") {
    savePath = "";
  }

  chrome.storage.sync.set({ apiKey: apiKey, savePath: savePath, shortcutKey: shortcutKey }, () => {
    showBubble('API Key, Save Path, and Shortcut Key saved');
    errorMessage.textContent = '';

    // 保存后刷新当前选项卡，让配置生效
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });

    window.close(); // 关闭popup窗口
  });
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.clear(() => {
    document.getElementById('api-key').value = '';
    document.getElementById('save-path').value = '';
    document.getElementById('shortcut-key').value = 'Ctrl+o';
    showBubble('Settings cleared');
  });
});

document.getElementById('shortcut-key').addEventListener('keydown', (event) => {
  event.preventDefault();
  const key = [];
  if (event.ctrlKey) key.push('Ctrl');
  if (event.metaKey) key.push('Meta');
  if (event.shiftKey) key.push('Shift');
  if (event.altKey) key.push('Alt');
  key.push(event.key);
  document.getElementById('shortcut-key').value = key.join('+');
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['apiKey', 'savePath', 'shortcutKey'], (result) => {
    if (result.apiKey) {
      document.getElementById('api-key').value = result.apiKey;
    }
    if (result.savePath) {
      document.getElementById('save-path').value = result.savePath;
    }
    if (result.shortcutKey) {
      document.getElementById('shortcut-key').value = result.shortcutKey;
    }
  });
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
