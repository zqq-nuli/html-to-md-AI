# HTML→MD — 浏览器扩展

[English](./README.md)

一个 Chrome 浏览器扩展，将网页内容转换为干净的 Markdown 格式，专为 AI 理解优化。基于 [html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown)（Go 语言）编译为 WebAssembly 驱动。

## 功能特性

- **整页转换** — 自动提取网页主要内容并转换为 Markdown
- **选中转换** — 仅转换选中的文本/HTML
- **WASM 驱动** — Go 语言的 `html-to-markdown` v2 通过 WebAssembly 直接在浏览器中运行
- **智能内容提取** — 自动识别 `<main>`、`<article>` 等内容区域
- **右键菜单** — 右键菜单快速转换
- **快捷键** — `Alt+M` 一键转换并复制到剪贴板
- **复制与下载** — 一键复制或下载为 `.md` 文件
- **域名感知** — 自动将相对 URL 转换为绝对路径
- **可编辑输出** — 复制前可编辑 Markdown 结果
- **中英双语** — 根据浏览器语言自动切换，支持手动切换

## 技术栈

| 组件 | 技术 |
|------|------|
| 转换引擎 | [html-to-markdown](https://github.com/JohannesKaufmann/html-to-markdown) v2（Go → WASM）|
| 扩展框架 | [WXT](https://wxt.dev/)（Manifest V3）|
| 开发语言 | TypeScript |
| 测试框架 | Vitest |
| 包管理器 | pnpm |

## 项目结构

```
html-to-md/
├── wasm/                          # Go WASM 模块
│   ├── main.go                    # 转换器入口
│   └── go.mod
├── extension/                     # Chrome 扩展（WXT）
│   ├── entrypoints/
│   │   ├── background.ts          # Service Worker（消息路由）
│   │   ├── content.ts             # 内容脚本（HTML 提取）
│   │   ├── offscreen/             # 离屏文档（WASM 宿主）
│   │   └── popup/                 # 扩展弹窗 UI
│   ├── utils/
│   │   └── i18n.ts                # 国际化模块
│   ├── public/
│   │   ├── converter.wasm         # 编译后的 WASM 二进制
│   │   └── wasm_exec.js           # Go WASM 运行时
│   ├── tests/
│   │   └── wasm-converter.test.ts
│   ├── wxt.config.ts
│   └── package.json
└── README.md
```

## 快速开始

### 前置要求

- [Go](https://go.dev/) 1.23+
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### 编译 WASM

```bash
cd wasm
GOOS=js GOARCH=wasm go build -o ../extension/public/converter.wasm .
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../extension/public/
```

### 安装与开发

```bash
cd extension
pnpm install
pnpm dev          # 开发模式，支持热重载
```

### 生产构建

```bash
cd extension
pnpm build        # 输出目录：.output/chrome-mv3/
```

### 运行测试

```bash
cd extension
pnpm test
```

### 在 Chrome 中加载

1. 打开 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/.output/chrome-mv3/` 目录

## 使用方式

| 操作 | 方法 |
|------|------|
| 转换整页 | 点击扩展图标 → 「转换整页」 |
| 转换选中 | 选中文本 → 点击扩展图标 → 「转换选中」 |
| 右键转换 | 右键 → 「Convert page/selection to Markdown」 |
| 快速转换 | 按 `Alt+M`（自动复制到剪贴板）|
| 下载文件 | 点击输出区域的 💾 按钮 |
| 切换语言 | 点击顶栏的语言按钮（中/EN）|

## 许可证

MIT
