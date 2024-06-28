document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key').value;
    let savePath = document.getElementById('save-path').value.trim();
    const errorMessage = document.getElementById('error-message');
  
    if (!apiKey) {
      errorMessage.textContent = 'API Key is required.';
      return;
    }
  
    if (savePath === "/") {
      savePath = "";
    }
  
    chrome.storage.sync.set({ apiKey: apiKey, savePath: savePath }, () => {
      showBubble('API Key and Save Path saved');
      errorMessage.textContent = '';
      window.close(); // 关闭popup窗口
    });
  });
  
  document.getElementById('reset').addEventListener('click', () => {
    chrome.storage.sync.clear(() => {
      document.getElementById('api-key').value = '';
      document.getElementById('save-path').value = '';
      showBubble('Settings cleared');
    });
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey', 'savePath'], (result) => {
      if (result.apiKey) {
        document.getElementById('api-key').value = result.apiKey;
      }
      if (result.savePath) {
        document.getElementById('save-path').value = result.savePath;
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
  