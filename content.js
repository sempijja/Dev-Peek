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
    document.body.appendChild(highlight);

    // Create and style the tooltip
    const tooltip = document.createElement("div");
    tooltip.className = "ui-highlighter-tooltip";
    tooltip.textContent = `Tag: ${element.tagName.toLowerCase()} | Classes: ${element.className || "none"} | Dimensions: ${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;
    tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(tooltip);
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
