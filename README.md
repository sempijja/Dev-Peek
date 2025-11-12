# **Dev Peek 2.0**

Dev Peek is a powerful, developer-friendly browser extension that brings Figma-like design and inspection capabilities directly to your web page. It provides a seamless way to inspect and edit UI elements in real-time, displaying an overlay and a draggable editor panel with detailed information and live editing tools.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (which includes npm).
- A Chromium-based browser (e.g., Google Chrome, Microsoft Edge, Brave).

### Installation & Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sempijja/Dev-Peek.git
    cd Dev-Peek
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the extension:**
    ```bash
    npm start
    ```
    This command will launch a new browser instance with the extension automatically installed. It supports hot-reloading, so any changes you make to the source code will be reflected in the browser instantly.

## Building for Production

To build the extension for production, run the following command:

```bash
npm run build
```

This will create a `.zip` file in the `web-ext-artifacts` directory, which can be uploaded to the Chrome Web Store or other extension marketplaces.

## Linting / Testing

To check the code for potential errors and style issues, run the linter:

```bash
npm run lint
```
The project's test command is an alias for linting:
```bash
npm test
```

---

## **Features**
- **Inspect Mode**: Activate a powerful inspect mode that highlights elements on hover.
- **Draggable Editor Panel**: A floating panel that can be moved anywhere on the screen to prevent obstruction.
- **Live Text and Style Editing**: Edit text content, colors, background, font size, margin, and padding in real-time.
- **Advanced Color Picker**: Includes an eyedropper tool to sample colors directly from the page.
- **Accessibility Insights**: Displays ARIA roles and color contrast ratios to help you build more accessible websites.
- **Modern UI**: A clean, minimalist interface that feels right at home in your browser.

---

---

## **Contributing**

We welcome contributions to Dev Peek! Here’s how you can contribute:

### **Bug Reports and Feature Requests**
1. Navigate to the **Issues** tab on GitHub.
2. Open a new issue and provide:
   - A clear title.
   - Steps to reproduce (for bugs).
   - Suggested features or enhancements (for feature requests).


### **Code Contributions**
1. **Fork the Repository**: Click on the fork button at the top-right corner of this repository.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Dev-Peek
   ```
3. **Create a New Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make Changes**: Implement your changes locally.
5. **Test Your Changes**: Ensure the extension works as expected.
6. **Commit and Push**:
   ```bash
   git add .
   git commit -m "Add feature: your-feature-name"
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**:
   - Go to the original repository.
   - Click on **Pull Requests** > **New Pull Request**.
   - Provide a detailed description of your changes and submit.


## **License**
This project is licensed under the MIT License.

---

## **Contact**
For questions or feedback, feel free to reach out to:
- **Author**: Ssempijja Charles (Charz)

Happy coding! 😊
