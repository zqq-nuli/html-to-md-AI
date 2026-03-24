# HTML→MD — Browser Extension

[中文文档](./README.zh-CN.md)

A Chrome extension that converts web pages to clean Markdown, optimized for AI consumption. Powered by [html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) (Go) compiled to WebAssembly.

## Features

- **Full Page Conversion** — Extract and convert the main content of any webpage to Markdown
- **Selection Conversion** — Convert only the selected text/HTML
- **WASM-Powered** — Go's `html-to-markdown` v2 library runs directly in the browser via WebAssembly
- **Smart Content Extraction** — Automatically finds `<main>`, `<article>`, or content areas
- **Right-Click Menu** — Context menu integration for quick conversion
- **Keyboard Shortcut** — `Alt+M` to instantly convert and copy
- **Copy & Download** — One-click copy to clipboard or download as `.md` file
- **Domain-Aware** — Resolves relative URLs to absolute paths
- **Editable Output** — Edit the Markdown result before copying
- **i18n** — Chinese / English, auto-detected from browser language with manual toggle

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Converter | [html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) v2 (Go → WASM) |
| Extension Framework | [WXT](https://wxt.dev/) (Manifest V3) |
| Language | TypeScript |
| Tests | Vitest |
| Package Manager | pnpm |

## Project Structure

```
html-to-md/
├── wasm/                          # Go WASM module
│   ├── main.go                    # Converter entry point
│   └── go.mod
├── extension/                     # Chrome extension (WXT)
│   ├── entrypoints/
│   │   ├── background.ts          # Service worker (message routing)
│   │   ├── content.ts             # Content script (HTML extraction)
│   │   ├── offscreen/             # Offscreen document (WASM host)
│   │   └── popup/                 # Extension popup UI
│   ├── utils/
│   │   └── i18n.ts                # Internationalization module
│   ├── public/
│   │   ├── converter.wasm         # Compiled WASM binary
│   │   └── wasm_exec.js           # Go WASM runtime
│   ├── tests/
│   │   └── wasm-converter.test.ts
│   ├── wxt.config.ts
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Go](https://go.dev/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### Build WASM

```bash
cd wasm
GOOS=js GOARCH=wasm go build -o ../extension/public/converter.wasm .
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../extension/public/
```

### Install & Develop

```bash
cd extension
pnpm install
pnpm dev          # Dev mode with hot reload
```

### Build for Production

```bash
cd extension
pnpm build        # Output: .output/chrome-mv3/
```

### Run Tests

```bash
cd extension
pnpm test
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/.output/chrome-mv3/`

## Usage

| Action | How |
|--------|-----|
| Convert full page | Click extension icon → "Convert Page" |
| Convert selection | Select text → Click icon → "Convert Selection" |
| Right-click convert | Right-click → "Convert page/selection to Markdown" |
| Quick convert | Press `Alt+M` (copies to clipboard) |
| Download `.md` | Click 💾 in the output area |
| Switch language | Click the language button (中/EN) in the header |

## License

MIT
