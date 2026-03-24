import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'HTML to Markdown',
    description: 'Convert web pages to clean Markdown — optimized for AI understanding',
    version: '1.0.0',
    permissions: ['activeTab', 'contextMenus', 'offscreen', 'scripting'],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    commands: {
      'convert-page': {
        suggested_key: { default: 'Alt+M' },
        description: 'Convert current page to Markdown',
      },
    },
  },
});
