let isInspectModeActive = false;
let currentObjectUrl = null;

// Function to start or stop inspection
function toggleInspect(isActive) {
    if (isActive) {
        document.addEventListener("mouseover", handleMouseOver);
        document.addEventListener("mouseout", handleMouseOut);
        document.addEventListener("click", handleMouseClick);
    } else {
        document.removeEventListener("mouseover", handleMouseOver);
        document.removeEventListener("mouseout", handleMouseOut);
        document.removeEventListener("click", handleMouseClick);
        removeHighlight();
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'deactivateInspectMode') {
        cleanup();
    } else if (request.action === 'toggleInspectMode') {
        isInspectModeActive = request.isActive;
        toggleInspect(isInspectModeActive);
    }
});

function cleanup() {
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
    isInspectModeActive = false;
    document.removeEventListener("mouseover", handleMouseOver);
    document.removeEventListener("mouseout", handleMouseOut);
    document.removeEventListener("click", handleMouseClick);
    const existingPanel = document.getElementById('editor-panel');
    if (existingPanel) existingPanel.remove();
    removeHighlight();
}

// Initial state check
chrome.storage.local.get('inspectModeActive', (data) => {
    isInspectModeActive = !!data.inspectModeActive;
    toggleInspect(isInspectModeActive);
});


function handleMouseOver(event) {
    const element = event.target;
    if (element.id !== 'editor-panel' && !element.closest('#editor-panel')) {
        highlightElement(element);
    }
}

function handleMouseOut() {
    removeHighlight();
}

function handleMouseClick(event) {
    if (isInspectModeActive) {
        const element = event.target;
        if (element.id !== 'editor-panel' && !element.closest('#editor-panel')) {
            event.preventDefault();
            event.stopPropagation();
            createEditorPanel(element);
        }
    }
}

function highlightElement(element) {
    removeHighlight(); // Ensure only one highlight at a time
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement("div");
    highlight.className = "ui-highlighter-overlay";
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;
    document.body.appendChild(highlight);
}

function removeHighlight() {
    const existingHighlight = document.querySelector(".ui-highlighter-overlay");
    if (existingHighlight) {
        existingHighlight.remove();
    }
}

function createEditorPanel(element) {
    // Remove existing panel
    const existingPanel = document.getElementById('editor-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    // Inject the Coloris script
    if (!document.querySelector('script[src*="coloris.min.js"]')) {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('coloris.min.js');
        document.head.appendChild(script);
        script.onload = () => {
            Coloris.init();
            Coloris({
                theme: 'large',
                swatches: [
                    '#264653',
                    '#2a9d8f',
                    '#e9c46a',
                    '#f4a261',
                    '#e76f51',
                    '#d62828',
                    '#023e8a',
                    '#0077b6',
                    '#0096c7',
                    '#00b4d8',
                    '#48cae4'
                ],
                eyeDropper: true,
                alpha: true
            });
        };
    }

    const panel = document.createElement('div');
    panel.id = 'editor-panel';

    const computedStyle = window.getComputedStyle(element);

    // Get accessibility info
    const ariaRole = element.getAttribute('role') || 'none';
    const color = getRGB(computedStyle.color);
    const backgroundColor = getRGB(computedStyle.backgroundColor);
    const contrastRatio = getContrastRatio(color, backgroundColor).toFixed(2);

    const isImageElement = element.tagName === 'IMG';
    const hasBackgroundImage = computedStyle.backgroundImage !== 'none';

    let editorContent;

    if (isImageElement || hasBackgroundImage) {
        editorContent = `
            <div class="editor-section">
                <h4>Image Grabber</h4>
                <p>Upload or paste an image to replace the current one.</p>
                <input type="file" id="image-upload-input" accept="image/*">
                <div id="paste-zone" style="border: 2px dashed #ccc; padding: 20px; text-align: center; margin-top: 10px;">
                    Paste Image Here
                </div>
            </div>
        `;
    } else {
        editorContent = `
            <div class="editor-section">
                <h4>Text</h4>
                <textarea id="text-editor">${element.innerText}</textarea>
            </div>
            <div class="editor-section">
                <h4>Styles</h4>
                <div class="style-editor">
                    <label>Color</label><input type="text" id="color-input" value="${computedStyle.color}" data-coloris>
                    <label>Bg Color</label><input type="text" id="bg-color-input" value="${computedStyle.backgroundColor}" data-coloris>
                    <label>Font Size</label><input type="text" id="font-size-input" value="${computedStyle.fontSize}">
                    <label>Margin</label><input type="text" id="margin-input" value="${computedStyle.margin}">
                    <label>Padding</label><input type="text" id="padding-input" value="${computedStyle.padding}">
                    <label>Border Radius</label><input type="text" id="border-radius-input" value="${computedStyle.borderRadius}">
                </div>
            </div>
            <div class="editor-section">
                <h4>Background Gradient</h4>
                <div class="gradient-editor">
                    <label>Direction</label><input type="text" id="gradient-direction-input" value="to right">
                    <label>Color 1</label><input type="text" id="gradient-color1-input" value="#ffffff" data-coloris>
                    <label>Color 2</label><input type="text" id="gradient-color2-input" value="#000000" data-coloris>
                </div>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="editor-header">
            <h3>Inspect Panel</h3>
            <button id="close-editor">×</button>
        </div>
        <div class="editor-content">
            ${editorContent}
            <div class="editor-section">
                <h4>Accessibility</h4>
                <p><strong>ARIA Role:</strong> ${ariaRole}</p>
                <p><strong>Contrast Ratio:</strong> ${contrastRatio}</p>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    const rect = element.getBoundingClientRect();
    panel.style.top = `${rect.bottom + window.scrollY + 10}px`;
    panel.style.left = `${rect.left + window.scrollX}px`;


    // Make the panel draggable
    makeDraggable(panel);

    // Add event listener to close button
    document.getElementById('close-editor').addEventListener('click', () => {
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        panel.remove();
    });

    // Add event listeners for real-time editing
    if (isImageElement || hasBackgroundImage) {
        const handleImageFile = (file) => {
            if (!file) return;
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
            const imageUrl = URL.createObjectURL(file);
            currentObjectUrl = imageUrl;
            if (isImageElement) {
                element.src = imageUrl;
            } else {
                element.style.backgroundImage = `url(${imageUrl})`;
            }
        };

        document.getElementById('image-upload-input').addEventListener('change', (e) => {
            handleImageFile(e.target.files[0]);
        });

        document.getElementById('paste-zone').addEventListener('paste', (e) => {
            e.preventDefault();
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.type.indexOf('image') === 0) {
                    handleImageFile(item.getAsFile());
                }
            }
        });
    } else {
        document.getElementById('text-editor').addEventListener('input', (e) => {
            element.innerText = e.target.value;
        });
        document.getElementById('color-input').addEventListener('input', (e) => {
        element.style.color = e.target.value;
    });
    document.getElementById('bg-color-input').addEventListener('input', (e) => {
        element.style.backgroundColor = e.target.value;
    });
    document.getElementById('font-size-input').addEventListener('input', (e) => {
        element.style.fontSize = e.target.value;
    });
    document.getElementById('margin-input').addEventListener('input', (e) => {
        element.style.margin = e.target.value;
    });
    document.getElementById('padding-input').addEventListener('input', (e) => {
        element.style.padding = e.target.value;
    });
    document.getElementById('border-radius-input').addEventListener('input', (e) => {
        element.style.borderRadius = e.target.value;
    });

    // Gradient listeners
    const gradientDirection = document.getElementById('gradient-direction-input');
    const gradientColor1 = document.getElementById('gradient-color1-input');
    const gradientColor2 = document.getElementById('gradient-color2-input');

    function updateGradient() {
        element.style.backgroundImage = `linear-gradient(${gradientDirection.value}, ${gradientColor1.value}, ${gradientColor2.value})`;
    }

    gradientDirection.addEventListener('input', updateGradient);
    gradientColor1.addEventListener('input', updateGradient);
    gradientColor2.addEventListener('input', updateGradient);
    }
}

// Helper functions for color contrast
function getRGB(colorStr) {
    if (!colorStr) return [255, 255, 255]; // Default to white
    const match = colorStr.match(/rgba?\((\d{1,3}), (\d{1,3}), (\d{1,3})/);
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [255, 255, 255];
}

function getLuminance(rgb) {
    const [r, g, b] = rgb.map(c => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(rgb1, rgb2) {
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function makeDraggable(panel) {
    const header = panel.querySelector('.editor-header');
    header.style.cursor = 'move';
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        offset.x = e.clientX - panel.offsetLeft;
        offset.y = e.clientY - panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = `${e.clientX - offset.x}px`;
        panel.style.top = `${e.clientY - offset.y}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}
