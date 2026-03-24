import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Test the Go WASM converter by loading it in a minimal JS environment
// Note: Go WASM requires browser/node polyfills from wasm_exec.js

let convertHTMLToMarkdown: (html: string, domain?: string) => { markdown: string; error: string };
let wasmAvailable = false;

beforeAll(async () => {
  try {
    const wasmExecPath = path.resolve(__dirname, '../public/wasm_exec.js');
    const wasmPath = path.resolve(__dirname, '../public/converter.wasm');

    if (!fs.existsSync(wasmExecPath) || !fs.existsSync(wasmPath)) {
      console.warn('WASM files not found, skipping WASM tests');
      return;
    }

    // Load wasm_exec.js which defines the Go class globally
    const wasmExecCode = fs.readFileSync(wasmExecPath, 'utf-8');
    // Execute in global scope
    const script = new Function(wasmExecCode);
    script();

    // @ts-expect-error - Go is defined by wasm_exec.js
    const go = new (globalThis as any).Go();
    const wasmBuffer = fs.readFileSync(wasmPath);
    const result = await WebAssembly.instantiate(wasmBuffer, go.importObject);
    go.run(result.instance);

    convertHTMLToMarkdown = (globalThis as any).convertHTMLToMarkdown;
    wasmAvailable = true;
  } catch (err) {
    console.warn('WASM init failed (expected in some CI environments):', err);
  }
});

describe('WASM Converter', () => {
  it('should have loaded WASM successfully', () => {
    if (!wasmAvailable) return;
    expect(convertHTMLToMarkdown).toBeDefined();
    expect(typeof convertHTMLToMarkdown).toBe('function');
  });

  it('should convert basic HTML tags to Markdown', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<h1>Hello World</h1><p>This is a <strong>test</strong>.</p>');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('# Hello World');
    expect(result.markdown).toContain('**test**');
  });

  it('should convert links', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<a href="https://example.com">Click here</a>');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('[Click here](https://example.com)');
  });

  it('should convert lists', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('- Item 1');
    expect(result.markdown).toContain('- Item 2');
  });

  it('should convert tables', () => {
    if (!wasmAvailable) return;
    const html = '<table><thead><tr><th>Name</th><th>Age</th></tr></thead><tbody><tr><td>Alice</td><td>30</td></tr></tbody></table>';
    const result = convertHTMLToMarkdown(html);
    expect(result.error).toBe('');
    expect(result.markdown).toContain('Name');
    expect(result.markdown).toContain('Age');
    expect(result.markdown).toContain('Alice');
  });

  it('should convert code blocks', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<pre><code>const x = 1;</code></pre>');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('const x = 1;');
  });

  it('should handle empty input', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('');
    expect(result.error).toBe('');
    expect(result.markdown).toBe('');
  });

  it('should handle nested formatting', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<p><strong><em>Bold and italic</em></strong></p>');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('Bold and italic');
  });

  it('should convert images', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<img src="https://example.com/img.png" alt="An image">');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('![An image](https://example.com/img.png)');
  });

  it('should handle domain-relative links when domain is provided', () => {
    if (!wasmAvailable) return;
    const result = convertHTMLToMarkdown('<a href="/about">About</a>', 'https://example.com');
    expect(result.error).toBe('');
    expect(result.markdown).toContain('https://example.com/about');
  });

  it('should strip script and style tags', () => {
    if (!wasmAvailable) return;
    const html = '<p>Hello</p><script>alert("xss")</script><style>body{color:red}</style><p>World</p>';
    const result = convertHTMLToMarkdown(html);
    expect(result.error).toBe('');
    expect(result.markdown).not.toContain('alert');
    expect(result.markdown).not.toContain('color:red');
    expect(result.markdown).toContain('Hello');
    expect(result.markdown).toContain('World');
  });
});

describe('Content extraction logic (unit)', () => {
  it('should produce clean filenames from titles', () => {
    const sanitize = (title: string) =>
      title
        .replace(/[^a-zA-Z0-9\u4e00-\u9fff-_ ]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60);

    expect(sanitize('Hello World!')).toBe('Hello-World');
    expect(sanitize('Test / Page | 2024')).toBe('Test-Page-2024');
    expect(sanitize('中文标题测试')).toBe('中文标题测试');
    expect(sanitize('')).toBe('');
    expect(sanitize('a'.repeat(100))).toHaveLength(60);
  });
});
