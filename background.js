// Listen for messages from the popup to toggle the inspect mode
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleInspectMode') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            if (request.isActive) {
                // Inject the content script and styles
                chrome.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: ["styles.css", "coloris.min.css"]
                });
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ["content.js"]
                });
            } else {
                // Send a message to the content script to deactivate and clean up
                chrome.tabs.sendMessage(tabId, { action: 'deactivateInspectMode' });
            }
        });
    }
    return true; // Keep the message channel open
});

// Set the initial state when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ inspectModeActive: false });
});
