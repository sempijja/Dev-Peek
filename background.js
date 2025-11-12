// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
    const tabId = tab.id;
    const currentState = await chrome.storage.session.get([`${tabId}`]);
    const isActive = !currentState[tabId];

    await chrome.storage.session.set({ [tabId]: isActive });

    if (isActive) {
        // Inject the content script and styles
        await chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ["styles.css", "coloris.min.css"]
        });
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        });
    } else {
        // Send a message to the content script to deactivate and clean up
        await chrome.tabs.sendMessage(tabId, { action: 'deactivateInspectMode' });
    }
});
