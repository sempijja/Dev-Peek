document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle-inspect');

    // Get the current state from storage and set the toggle accordingly
    chrome.storage.local.get('inspectModeActive', (data) => {
        toggle.checked = !!data.inspectModeActive;
    });

    // Add a listener to the toggle switch
    toggle.addEventListener('change', () => {
        const isActive = toggle.checked;
        chrome.storage.local.set({ inspectModeActive: isActive });

        // Send a message to the background script to inject or remove the content script
        chrome.runtime.sendMessage({
            action: 'toggleInspectMode',
            isActive: isActive
        });
    });
});
