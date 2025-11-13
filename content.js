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

// The script is now injected on demand, so we can assume it's active.
isInspectModeActive = true;
toggleInspect(isInspectModeActive);


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

    // Store original styles for reset functionality
    const originalStyles = {
        innerText: element.innerText,
        color: element.style.color,
        backgroundColor: element.style.backgroundColor,
        fontSize: element.style.fontSize,
        marginTop: element.style.marginTop,
        marginRight: element.style.marginRight,
        marginBottom: element.style.marginBottom,
        marginLeft: element.style.marginLeft,
        paddingTop: element.style.paddingTop,
        paddingRight: element.style.paddingRight,
        paddingBottom: element.style.paddingBottom,
        paddingLeft: element.style.paddingLeft,
        borderTopLeftRadius: element.style.borderTopLeftRadius,
        borderTopRightRadius: element.style.borderTopRightRadius,
        borderBottomRightRadius: element.style.borderBottomRightRadius,
        borderBottomLeftRadius: element.style.borderBottomLeftRadius,
        backgroundImage: element.style.backgroundImage,
        src: element.tagName === 'IMG' ? element.src : null
    };

    // Inject the Coloris script and CSS override
    if (!document.querySelector('script[src*="coloris.min.js"]')) {
        // Inject Override CSS
        const overrideLink = document.createElement('link');
        overrideLink.rel = 'stylesheet';
        overrideLink.href = chrome.runtime.getURL('override.css');
        document.head.appendChild(overrideLink);

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
    let panelTitle = "Dev Peek";

    if (isImageElement || hasBackgroundImage) {
        panelTitle = "Image Grabber";
        editorContent = `
            <div class="editor-section">
                <p>Upload an image to replace the current one</p>
            </div>
            <div class="editor-section">
                <h4>Image</h4>
                <div class="file-upload-wrapper">
                    <input type="file" id="image-upload-input" accept="image/*" class="file-upload-input">
                    <label for="image-upload-input" class="file-upload-button">Chose file</label>
                    <span id="file-name" class="file-name">No file chosen</span>
                </div>
            </div>
        `;
    } else {
        const marginValues = {
            top: computedStyle.marginTop,
            right: computedStyle.marginRight,
            bottom: computedStyle.marginBottom,
            left: computedStyle.marginLeft
        };
        const paddingValues = {
            top: computedStyle.paddingTop,
            right: computedStyle.paddingRight,
            bottom: computedStyle.paddingBottom,
            left: computedStyle.paddingLeft
        };
        const borderRadiusValues = {
            topLeft: computedStyle.borderTopLeftRadius,
            topRight: computedStyle.borderTopRightRadius,
            bottomRight: computedStyle.borderBottomRightRadius,
            bottomLeft: computedStyle.borderBottomLeftRadius
        };

        editorContent = `
            <div class="editor-section">
                <h4>Text</h4>
                <textarea id="text-editor">${element.innerText}</textarea>
            </div>
            <div class="editor-section">
                <h4>Design</h4>
                <div class="style-editor">
                    <label>Color</label><input type="text" id="color-input" value="${computedStyle.color}" data-coloris>
                    <label>Bg Color</label><input type="text" id="bg-color-input" value="${computedStyle.backgroundColor}" data-coloris>
                </div>
            </div>
            <div class="editor-section">
                <h4>Background gradient</h4>
                <div class="style-editor">
                    <label>Direction</label>
                    <select id="gradient-direction-input">
                        <option value="to right">to right</option>
                        <option value="to left">to left</option>
                        <option value="to top">to top</option>
                        <option value="to bottom">to bottom</option>
                        <option value="to top right">to top right</option>
                        <option value="to top left">to top left</option>
                        <option value="to bottom right">to bottom right</option>
                        <option value="to bottom left">to bottom left</option>
                    </select>
                    <label>Color 1</label><input type="text" id="gradient-color1-input" value="#ffffff" data-coloris>
                    <label>Color 2</label><input type="text" id="gradient-color2-input" value="#000000" data-coloris>
                </div>
            </div>
            <div class="editor-section">
                 <div class="style-editor">
                    <label>Font size</label><input type="text" id="font-size-input" value="${computedStyle.fontSize}">

                    <label>Margin</label>
                    <div class="grid-inputs">
                        <input type="text" id="margin-top-input" placeholder="top" value="${marginValues.top}">
                        <input type="text" id="margin-right-input" placeholder="right" value="${marginValues.right}">
                        <input type="text" id="margin-bottom-input" placeholder="bottom" value="${marginValues.bottom}">
                        <input type="text" id="margin-left-input" placeholder="left" value="${marginValues.left}">
                    </div>

                    <label>Padding</label>
                    <div class="grid-inputs">
                        <input type="text" id="padding-top-input" placeholder="top" value="${paddingValues.top}">
                        <input type="text" id="padding-right-input" placeholder="right" value="${paddingValues.right}">
                        <input type="text" id="padding-bottom-input" placeholder="bottom" value="${paddingValues.bottom}">
                        <input type="text" id="padding-left-input" placeholder="left" value="${paddingValues.left}">
                    </div>

                    <label>Border-radius</label>
                    <div class="grid-inputs">
                        <input type="text" id="border-radius-top-left-input" placeholder="top-left" value="${borderRadiusValues.topLeft}">
                        <input type="text" id="border-radius-top-right-input" placeholder="top-right" value="${borderRadiusValues.topRight}">
                        <input type="text" id="border-radius-bottom-right-input" placeholder="bottom-right" value="${borderRadiusValues.bottomRight}">
                        <input type="text" id="border-radius-bottom-left-input" placeholder="bottom-left" value="${borderRadiusValues.bottomLeft}">
                    </div>
                </div>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="editor-header">
            <h3>${panelTitle}</h3>
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
        <div class="editor-footer">
            <button id="reset-editor">Reset</button>
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

    // Add event listener to reset button
    document.getElementById('reset-editor').addEventListener('click', () => {
        // Reset text content
        if (originalStyles.innerText !== null) {
            element.innerText = originalStyles.innerText;
        }

        // Reset styles
        element.style.color = originalStyles.color;
        element.style.backgroundColor = originalStyles.backgroundColor;
        element.style.fontSize = originalStyles.fontSize;
        element.style.marginTop = originalStyles.marginTop;
        element.style.marginRight = originalStyles.marginRight;
        element.style.marginBottom = originalStyles.marginBottom;
        element.style.marginLeft = originalStyles.marginLeft;
        element.style.paddingTop = originalStyles.paddingTop;
        element.style.paddingRight = originalStyles.paddingRight;
        element.style.paddingBottom = originalStyles.paddingBottom;
        element.style.paddingLeft = originalStyles.paddingLeft;
        element.style.borderTopLeftRadius = originalStyles.borderTopLeftRadius;
        element.style.borderTopRightRadius = originalStyles.borderTopRightRadius;
        element.style.borderBottomRightRadius = originalStyles.borderBottomRightRadius;
        element.style.borderBottomLeftRadius = originalStyles.borderBottomLeftRadius;
        element.style.backgroundImage = originalStyles.backgroundImage;

        // Reset image src if it's an image element
        if (element.tagName === 'IMG' && originalStyles.src) {
            element.src = originalStyles.src;
        }

        // Refresh the color inputs and other fields to reflect the reset
        if (!isImageElement && !hasBackgroundImage) {
            const textEditor = document.getElementById('text-editor');
            if (textEditor) textEditor.value = originalStyles.innerText;

            const colorInput = document.getElementById('color-input');
            if (colorInput) colorInput.value = computedStyle.color;

            const bgColorInput = document.getElementById('bg-color-input');
            if (bgColorInput) bgColorInput.value = computedStyle.backgroundColor;

            const fontSizeInput = document.getElementById('font-size-input');
            if (fontSizeInput) fontSizeInput.value = computedStyle.fontSize;
        }
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

        const imageUploadInput = document.getElementById('image-upload-input');
        const fileNameSpan = document.getElementById('file-name');

        imageUploadInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameSpan.textContent = e.target.files[0].name;
                handleImageFile(e.target.files[0]);
            } else {
                fileNameSpan.textContent = 'No file chosen';
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

    // Margin listeners
    ['top', 'right', 'bottom', 'left'].forEach(side => {
        document.getElementById(`margin-${side}-input`).addEventListener('input', (e) => {
            element.style[`margin${side.charAt(0).toUpperCase() + side.slice(1)}`] = e.target.value;
        });
    });

    // Padding listeners
    ['top', 'right', 'bottom', 'left'].forEach(side => {
        document.getElementById(`padding-${side}-input`).addEventListener('input', (e) => {
            element.style[`padding${side.charAt(0).toUpperCase() + side.slice(1)}`] = e.target.value;
        });
    });

    // Border-radius listeners
    ['top-left', 'top-right', 'bottom-right', 'bottom-left'].forEach(corner => {
        document.getElementById(`border-radius-${corner}-input`).addEventListener('input', (e) => {
            const camelCaseCorner = corner.replace(/-([a-z])/g, g => g[1].toUpperCase());
            element.style[`border${camelCaseCorner.charAt(0).toUpperCase() + camelCaseCorner.slice(1)}Radius`] = e.target.value;
        });
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
