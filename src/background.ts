export { }

// Open Side Panel on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error))

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "open_side_panel") {
        // Open side panel in the window where the shortcut was pressed
        if (sender.tab?.windowId) {
            chrome.sidePanel.open({ windowId: sender.tab.windowId })
                .catch(err => console.error("Failed to open side panel:", err))
        }
    }
})

console.log("Sidenote2Obsidian Background Service Worker Loaded")
