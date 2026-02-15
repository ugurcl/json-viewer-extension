# JSON Viewer Extension

A Chrome extension that automatically detects JSON responses and formats them with syntax highlighting, tree view, search and filtering.

## Features

- Auto-detect JSON on any page and format it
- Tree view with collapsible nodes
- Raw JSON view with pretty printing
- Search through keys and values
- Expand / Collapse all nodes
- Copy formatted JSON to clipboard
- Paste JSON from clipboard into popup
- Dark theme UI
- Lightweight, no external dependencies

## Installation

1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

## Usage

**Auto-format:** Navigate to any URL that returns raw JSON. The extension will detect it and render a formatted tree view with a toolbar.

**Popup:** Click the extension icon to open the popup. Paste any JSON and click "Format JSON" to view it.

## Project Structure

```
json-viewer/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   ├── content.js
│   └── content.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Tech Stack

- JavaScript (Vanilla)
- Chrome Extension Manifest V3
- HTML5 / CSS3
