// Helper functions for creating Spectrum UI elements
function createSpectrumHeading(level, size, text) {
    const heading = document.createElement(level);
    heading.className = `spectrum-Heading spectrum-Heading--size${size}`;
    heading.textContent = text;
    return heading;
}

function createSpectrumBody(size, text) {
    const body = document.createElement('p');
    body.className = `spectrum-Body--size${size}`;
    body.textContent = text;
    return body;
}

function createSpectrumTextfield(id, value, isColor = false) {
    const wrapper = document.createElement('div');
    wrapper.className = 'spectrum-Textfield';
    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.className = 'spectrum-Textfield-input';
    input.value = value;
    if (isColor) {
        input.setAttribute('data-coloris', '');
    }
    wrapper.appendChild(input);
    return wrapper;
}

function createSpectrumPicker(id, options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'spectrum-Picker spectrum-Picker--sizeM';
    const select = document.createElement('select');
    select.id = id;
    select.className = 'spectrum-Picker-select';
    options.forEach(optionValue => {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
    });
    wrapper.appendChild(select);
    return wrapper;
}

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
    panel.classList.add('spectrum-Well');

    const computedStyle = window.getComputedStyle(element);

    // Get accessibility info
    const ariaRole = element.getAttribute('role') || 'none';
    const color = getRGB(computedStyle.color);
    const backgroundColor = getRGB(computedStyle.backgroundColor);
    const contrastRatio = getContrastRatio(color, backgroundColor).toFixed(2);

    const isImageElement = element.tagName === 'IMG';
    const hasBackgroundImage = computedStyle.backgroundImage !== 'none';

    let panelTitle = "Dev Peek";

    const header = document.createElement('div');
    header.className = 'editor-header';

    const title = document.createElement('h3');
    title.className = 'spectrum-Heading spectrum-Heading--sizeS';
    title.textContent = panelTitle;
    header.appendChild(title);

    const closeButton = document.createElement('button');
    closeButton.id = 'close-editor';
    closeButton.className = 'spectrum-ActionButton spectrum-ActionButton--quiet';
    const closeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    closeIcon.setAttribute('class', 'spectrum-Icon spectrum-Icon--sizeM');
    closeIcon.setAttribute('focusable', 'false');
    closeIcon.setAttribute('aria-hidden', 'true');
    closeIcon.setAttribute('aria-label', 'Close');
    const closeIconUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    closeIconUse.setAttribute('xlink:href', '#spectrum-icon-18-Cross');
    closeIcon.appendChild(closeIconUse);
    closeButton.appendChild(closeIcon);
    header.appendChild(closeButton);

    panel.appendChild(header);

    const content = document.createElement('div');
    content.className = 'editor-content';

    if (isImageElement || hasBackgroundImage) {
        panelTitle = "Image Grabber";
        title.textContent = panelTitle;

        const imageUploaderSection = document.createElement('div');
        imageUploaderSection.className = 'editor-section';
        imageUploaderSection.appendChild(createSpectrumBody('S', 'Upload an image to replace the current one'));
        content.appendChild(imageUploaderSection);

        const imageSection = document.createElement('div');
        imageSection.className = 'editor-section';
        imageSection.appendChild(createSpectrumHeading('h4', 'XS', 'Image'));
        const fileUploadWrapper = document.createElement('div');
        fileUploadWrapper.className = 'file-upload-wrapper';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'image-upload-input';
        fileInput.accept = 'image/*';
        fileInput.className = 'file-upload-input';
        fileUploadWrapper.appendChild(fileInput);
        const fileLabel = document.createElement('label');
        fileLabel.htmlFor = 'image-upload-input';
        fileLabel.className = 'spectrum-Button spectrum-Button--primary spectrum-Button--sizeM';
        fileLabel.textContent = 'Chose file';
        fileUploadWrapper.appendChild(fileLabel);
        const fileName = document.createElement('span');
        fileName.id = 'file-name';
        fileName.className = 'spectrum-Body--sizeS file-name';
        fileName.textContent = 'No file chosen';
        fileUploadWrapper.appendChild(fileName);
        imageSection.appendChild(fileUploadWrapper);
        content.appendChild(imageSection);
    } else {
        const textSection = document.createElement('div');
        textSection.className = 'editor-section';
        textSection.appendChild(createSpectrumHeading('h4', 'XS', 'Text'));
        const textAreaWrapper = document.createElement('div');
        textAreaWrapper.className = 'spectrum-TextArea';
        const textArea = document.createElement('textarea');
        textArea.id = 'text-editor';
        textArea.className = 'spectrum-TextArea-input';
        textArea.textContent = element.innerText;
        textAreaWrapper.appendChild(textArea);
        textSection.appendChild(textAreaWrapper);
        content.appendChild(textSection);

        const designSection = document.createElement('div');
        designSection.className = 'editor-section';
        designSection.appendChild(createSpectrumHeading('h4', 'XS', 'Design'));
        const styleEditor = document.createElement('div');
        styleEditor.className = 'style-editor';
        styleEditor.appendChild(createSpectrumBody('S', 'Color'));
        styleEditor.appendChild(createSpectrumTextfield('color-input', computedStyle.color, true));
        styleEditor.appendChild(createSpectrumBody('S', 'Bg Color'));
        styleEditor.appendChild(createSpectrumTextfield('bg-color-input', computedStyle.backgroundColor, true));
        designSection.appendChild(styleEditor);
        content.appendChild(designSection);

        const gradientSection = document.createElement('div');
        gradientSection.className = 'editor-section';
        gradientSection.appendChild(createSpectrumHeading('h4', 'XS', 'Background gradient'));
        const gradientEditor = document.createElement('div');
        gradientEditor.className = 'gradient-editor';
        gradientEditor.appendChild(createSpectrumBody('S', 'Direction'));
        gradientEditor.appendChild(createSpectrumPicker('gradient-direction-input', ['to right', 'to left', 'to top', 'to bottom', 'to top right', 'to top left', 'to bottom right', 'to bottom left']));
        gradientEditor.appendChild(createSpectrumBody('S', 'Color 1'));
        gradientEditor.appendChild(createSpectrumTextfield('gradient-color1-input', '#ffffff', true));
        gradientEditor.appendChild(createSpectrumBody('S', 'Color 2'));
        gradientEditor.appendChild(createSpectrumTextfield('gradient-color2-input', '#000000', true));
        gradientSection.appendChild(gradientEditor);
        content.appendChild(gradientSection);

        const stylesSection = document.createElement('div');
        stylesSection.className = 'editor-section';
        const styleEditor2 = document.createElement('div');
        styleEditor2.className = 'style-editor';
        styleEditor2.appendChild(createSpectrumBody('S', 'Font size'));
        styleEditor2.appendChild(createSpectrumTextfield('font-size-input', computedStyle.fontSize));

        const marginValues = { top: computedStyle.marginTop, right: computedStyle.marginRight, bottom: computedStyle.marginBottom, left: computedStyle.marginLeft };
        styleEditor2.appendChild(createSpectrumBody('S', 'Margin'));
        const marginGrid = document.createElement('div');
        marginGrid.className = 'grid-inputs';
        Object.entries(marginValues).forEach(([side, value]) => {
            marginGrid.appendChild(createSpectrumTextfield(`margin-${side}-input`, value));
        });
        styleEditor2.appendChild(marginGrid);

        const paddingValues = { top: computedStyle.paddingTop, right: computedStyle.paddingRight, bottom: computedStyle.paddingBottom, left: computedStyle.paddingLeft };
        styleEditor2.appendChild(createSpectrumBody('S', 'Padding'));
        const paddingGrid = document.createElement('div');
        paddingGrid.className = 'grid-inputs';
        Object.entries(paddingValues).forEach(([side, value]) => {
            paddingGrid.appendChild(createSpectrumTextfield(`padding-${side}-input`, value));
        });
        styleEditor2.appendChild(paddingGrid);

        const borderRadiusValues = { 'top-left': computedStyle.borderTopLeftRadius, 'top-right': computedStyle.borderTopRightRadius, 'bottom-right': computedStyle.borderBottomRightRadius, 'bottom-left': computedStyle.borderBottomLeftRadius };
        styleEditor2.appendChild(createSpectrumBody('S', 'Border-radius'));
        const borderRadiusGrid = document.createElement('div');
        borderRadiusGrid.className = 'grid-inputs';
        Object.entries(borderRadiusValues).forEach(([corner, value]) => {
            borderRadiusGrid.appendChild(createSpectrumTextfield(`border-radius-${corner}-input`, value));
        });
        styleEditor2.appendChild(borderRadiusGrid);

        stylesSection.appendChild(styleEditor2);
        content.appendChild(stylesSection);
    }

    const accessibilitySection = document.createElement('div');
    accessibilitySection.className = 'editor-section';
    const accessibilityTitle = document.createElement('h4');
    accessibilityTitle.className = 'spectrum-Heading spectrum-Heading--sizeXS';
    accessibilityTitle.textContent = 'Accessibility';
    accessibilitySection.appendChild(accessibilityTitle);

    const ariaRoleP = createSpectrumBody('S', '');
    const ariaRoleStrong = document.createElement('strong');
    ariaRoleStrong.textContent = 'ARIA Role: ';
    ariaRoleP.appendChild(ariaRoleStrong);
    ariaRoleP.append(ariaRole);
    accessibilitySection.appendChild(ariaRoleP);

    const contrastRatioP = createSpectrumBody('S', '');
    const contrastRatioStrong = document.createElement('strong');
    contrastRatioStrong.textContent = 'Contrast Ratio: ';
    contrastRatioP.appendChild(contrastRatioStrong);
    contrastRatioP.append(contrastRatio);
    accessibilitySection.appendChild(contrastRatioP);

    content.appendChild(accessibilitySection);
    panel.appendChild(content);

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
