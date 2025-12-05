chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getCurrentTabInfo") {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        sendResponse({
          url: currentTab.url,
          title: currentTab.title
        });
      });
      return true;  // 保持消息通道开放，以便异步发送响应
    }
  });