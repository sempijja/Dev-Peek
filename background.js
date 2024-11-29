let isActive = false;

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive;

  if (isActive) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } else {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Remove all overlays and tooltips
        const overlays = document.querySelectorAll(".ui-highlighter-overlay");
        const tooltips = document.querySelectorAll(".ui-highlighter-tooltip");
        overlays.forEach((overlay) => overlay.remove());
        tooltips.forEach((tooltip) => tooltip.remove());
        document.removeEventListener("mouseover", window.hoverPeekHandler);
        document.removeEventListener("mouseout", window.hoverPeekHandlerOut);
      },
    });
  }
});
