// Listen for messages from the popup to toggle the inspect mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleInspectMode') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            if (request.isActive) {
                // Inject the content script and styles
                chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: ["styles.css"]
                });
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["content.js"]
                });
            } else {
                // Remove the content script's effects
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                        const existingPanel = document.getElementById('editor-panel');
                        if (existingPanel) existingPanel.remove();
                        const existingHighlight = document.querySelector(".ui-highlighter-overlay");
                        if (existingHighlight) existingHighlight.remove();
                        // Turn off all event listeners by reloading the content script's state
                        // The content script will handle this, so we just message it.
                         window.location.reload(); // A simple way to clean up listeners
                    }
                });
            }
        });
    }
    return true; // Keep the message channel open
});

// Set the initial state when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ inspectModeActive: false });
});
