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

    // Inject the Coloris script and CSS override
    if (!document.querySelector('script[src*="coloris.min.js"]')) {
        const injectStylesheet = (href) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = chrome.runtime.getURL(href);
            document.head.appendChild(link);
        };

        // Inject Spectrum CSS
        injectStylesheet('node_modules/@spectrum-css/vars/dist/spectrum-dark.css');
        injectStylesheet('node_modules/@spectrum-css/typography/dist/index.min.css');
        injectStylesheet('node_modules/@spectrum-css/textfield/dist/index.min.css');
        injectStylesheet('node_modules/@spectrum-css/button/dist/index.min.css');
        injectStylesheet('node_modules/@spectrum-css/picker/dist/index.min.css');

        // Inject Override CSS
        injectStylesheet('override.css');

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
                <p class="spectrum-Body--sizeS">Upload an image to replace the current one</p>
            </div>
            <div class="editor-section">
                <h4 class="spectrum-Heading spectrum-Heading--sizeXS">Image</h4>
                <div class="file-upload-wrapper">
                    <input type="file" id="image-upload-input" accept="image/*" class="file-upload-input">
                    <label for="image-upload-input" class="spectrum-Button spectrum-Button--primary spectrum-Button--sizeM">Chose file</label>
                    <span id="file-name" class="spectrum-Body--sizeS file-name">No file chosen</span>
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
                <h4 class="spectrum-Heading spectrum-Heading--sizeXS">Text</h4>
                <div class="spectrum-TextArea">
                    <textarea id="text-editor" class="spectrum-TextArea-input">${element.innerText}</textarea>
                </div>
            </div>
            <div class="editor-section">
                <h4 class="spectrum-Heading spectrum-Heading--sizeXS">Design</h4>
                <div class="style-editor">
                    <label class="spectrum-Body--sizeS">Color</label>
                    <div class="spectrum-Textfield">
                        <input type="text" id="color-input" class="spectrum-Textfield-input" value="${computedStyle.color}" data-coloris>
                    </div>
                    <label class="spectrum-Body--sizeS">Bg Color</label>
                    <div class="spectrum-Textfield">
                        <input type="text" id="bg-color-input" class="spectrum-Textfield-input" value="${computedStyle.backgroundColor}" data-coloris>
                    </div>
                </div>
            </div>
            <div class="editor-section">
                <h4 class="spectrum-Heading spectrum-Heading--sizeXS">Background gradient</h4>
                <div class="gradient-editor">
                    <label class="spectrum-Body--sizeS">Direction</label>
                    <div class="spectrum-Picker spectrum-Picker--sizeM">
                        <select id="gradient-direction-input" class="spectrum-Picker-select">
                            <option value="to right">to right</option>
                            <option value="to left">to left</option>
                            <option value="to top">to top</option>
                            <option value="to bottom">to bottom</option>
                            <option value="to top right">to top right</option>
                            <option value="to top left">to top left</option>
                            <option value="to bottom right">to bottom right</option>
                            <option value="to bottom left">to bottom left</option>
                        </select>
                    </div>
                    <label class="spectrum-Body--sizeS">Color 1</label>
                    <div class="spectrum-Textfield">
                        <input type="text" id="gradient-color1-input" class="spectrum-Textfield-input" value="#ffffff" data-coloris>
                    </div>
                    <label class="spectrum-Body--sizeS">Color 2</label>
                    <div class="spectrum-Textfield">
                        <input type="text" id="gradient-color2-input" class="spectrum-Textfield-input" value="#000000" data-coloris>
                    </div>
                </div>
            </div>
            <div class="editor-section">
                 <div class="style-editor">
                    <label class="spectrum-Body--sizeS">Font size</label>
                    <div class="spectrum-Textfield">
                        <input type="text" id="font-size-input" class="spectrum-Textfield-input" value="${computedStyle.fontSize}">
                    </div>

                    <label class="spectrum-Body--sizeS">Margin</label>
                    <div class="grid-inputs">
                        <div class="spectrum-Textfield"><input type="text" id="margin-top-input" class="spectrum-Textfield-input" placeholder="top" value="${marginValues.top}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="margin-right-input" class="spectrum-Textfield-input" placeholder="right" value="${marginValues.right}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="margin-bottom-input" class="spectrum-Textfield-input" placeholder="bottom" value="${marginValues.bottom}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="margin-left-input" class="spectrum-Textfield-input" placeholder="left" value="${marginValues.left}"></div>
                    </div>

                    <label class="spectrum-Body--sizeS">Padding</label>
                    <div class="grid-inputs">
                        <div class="spectrum-Textfield"><input type="text" id="padding-top-input" class="spectrum-Textfield-input" placeholder="top" value="${paddingValues.top}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="padding-right-input" class="spectrum-Textfield-input" placeholder="right" value="${paddingValues.right}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="padding-bottom-input" class="spectrum-Textfield-input" placeholder="bottom" value="${paddingValues.bottom}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="padding-left-input" class="spectrum-Textfield-input" placeholder="left" value="${paddingValues.left}"></div>
                    </div>

                    <label class="spectrum-Body--sizeS">Border-radius</label>
                    <div class="grid-inputs">
                        <div class="spectrum-Textfield"><input type="text" id="border-radius-top-left-input" class="spectrum-Textfield-input" placeholder="top-left" value="${borderRadiusValues.topLeft}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="border-radius-top-right-input" class="spectrum-Textfield-input" placeholder="top-right" value="${borderRadiusValues.topRight}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="border-radius-bottom-right-input" class="spectrum-Textfield-input" placeholder="bottom-right" value="${borderRadiusValues.bottomRight}"></div>
                        <div class="spectrum-Textfield"><input type="text" id="border-radius-bottom-left-input" class="spectrum-Textfield-input" placeholder="bottom-left" value="${borderRadiusValues.bottomLeft}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="editor-header">
            <h3 class="spectrum-Heading spectrum-Heading--sizeS">${panelTitle}</h3>
            <button id="close-editor" class="spectrum-ActionButton spectrum-ActionButton--quiet">
                <svg class="spectrum-Icon spectrum-Icon--sizeM" focusable="false" aria-hidden="true" aria-label="Close">
                    <use xlink:href="#spectrum-icon-18-Cross" />
                </svg>
            </button>
        </div>
        <div class="editor-content">
            ${editorContent}
            <div class="editor-section">
                <h4 class="spectrum-Heading spectrum-Heading--sizeXS">Accessibility</h4>
                <p class="spectrum-Body--sizeS"><strong>ARIA Role:</strong> ${ariaRole}</p>
                <p class="spectrum-Body--sizeS"><strong>Contrast Ratio:</strong> ${contrastRatio}</p>
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
