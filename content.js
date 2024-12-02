// Ensure the script runs after the document is fully loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initializeHoverPeek();
} else {
  document.addEventListener('DOMContentLoaded', initializeHoverPeek);
}

function initializeHoverPeek() {
  // Create global event handlers for toggling
  window.hoverPeekHandler = (event) => {
    const element = event.target;

    // Remove existing highlights
    const existingHighlight = document.querySelector(".ui-highlighter-overlay");
    const existingTooltip = document.querySelector(".ui-highlighter-tooltip");
    if (existingHighlight) existingHighlight.remove();
    if (existingTooltip) existingTooltip.remove();

    // Create and style the highlight overlay
    const highlight = document.createElement("div");
    const rect = element.getBoundingClientRect();
    highlight.className = "ui-highlighter-overlay";
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    highlight.style.position = "absolute";
    highlight.style.border = "6px solid #00ff00"; // the highlight of the component
    highlight.style.pointerEvents = "none"; // Allow hover to pass through
    document.body.appendChild(highlight);

    // Get CSS properties of the element
    const computedStyles = window.getComputedStyle(element);
    // Variable extracting css properties
    const cssProperties = ` 
      color: ${computedStyles.color};
      font-size: ${computedStyles.fontSize};
      background: ${computedStyles.backgroundColor};
      margin: ${computedStyles.margin};
      padding: ${computedStyles.padding};
      border-radius: ${computedStyles.borderRadius}
    `.trim();

    // Create and style the tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "ui-highlighter-tooltip";
    tooltip.innerHTML = `
      <button id="copy-css" style="position: absolute; top: 4px; right: 4px; padding: 4px 8px; font-size: 10px; cursor: pointer; border-radius: 4px;">Copy CSS</button>
      Tag: ${element.tagName.toLowerCase()}<br>
      Classes: ${element.className || "none"}<br>
      Dimensions: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px<br>
      <pre style="margin: 5px 0; font-size: 12px; white-space: pre-wrap; color: white; ">${cssProperties}</pre>
      <span id="copy-feedback" style="display: none; position: absolute; top: -20px; right: 4px; color: green; font-size: 12px;">Copied!</span>
    `;
    tooltip.style.position = "absolute";
    tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    tooltip.style.color = "#fff";
    tooltip.style.padding = "12px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.zIndex = "9999";
    tooltip.style.pointerEvents = "auto"; // Allow interaction with the button
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(tooltip);

    // Add copy functionality
    const copyButton = document.getElementById("copy-css");
    const copyFeedback = document.getElementById("copy-feedback");

    const copyCSS = () => {
      navigator.clipboard.writeText(cssProperties).then(() => {
        // Display feedback message
        copyFeedback.style.display = "inline";
        setTimeout(() => {
          copyFeedback.style.display = "none"; // Hide after 2 seconds
        }, 2000);
      });
    };

    // Add click and Enter key functionality
    copyButton.addEventListener("click", copyCSS);
    document.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter") {
        copyCSS();
      }
    });
  };

  window.hoverPeekHandlerOut = () => {
    const highlight = document.querySelector(".ui-highlighter-overlay");
    const tooltip = document.querySelector(".ui-highlighter-tooltip");
    if (highlight) highlight.remove();
    if (tooltip) tooltip.remove();
  };

  // Add event listeners for hover
  document.addEventListener("mouseover", window.hoverPeekHandler);
  document.addEventListener("mouseout", window.hoverPeekHandlerOut);
}
