// Offscreen document: loads Go WASM and handles HTML→Markdown conversion

let wasmReady = false;
let wasmError = '';

async function initWasm() {
  try {
    const wasmExecUrl = chrome.runtime.getURL('/wasm_exec.js');
    console.log('[html-to-md] wasm_exec.js URL:', wasmExecUrl);

    // Check if Go class exists (loaded by wasm_exec.js in HTML)
    if (typeof (globalThis as any).Go === 'undefined') {
      wasmError = 'Go class not found — wasm_exec.js failed to load';
      console.error('[html-to-md]', wasmError);
      return;
    }

    // @ts-expect-error - Go is injected by wasm_exec.js
    const go = new Go();
    const wasmUrl = chrome.runtime.getURL('/converter.wasm');
    console.log('[html-to-md] Loading WASM from:', wasmUrl);

    const response = await fetch(wasmUrl);
    if (!response.ok) {
      wasmError = `Failed to fetch WASM: ${response.status} ${response.statusText}`;
      console.error('[html-to-md]', wasmError);
      return;
    }

    const result = await WebAssembly.instantiateStreaming(
      fetch(wasmUrl),
      go.importObject,
    );
    go.run(result.instance);

    // Verify the function is available
    if (typeof (globalThis as any).convertHTMLToMarkdown !== 'function') {
      wasmError = 'WASM loaded but convertHTMLToMarkdown function not found';
      console.error('[html-to-md]', wasmError);
      return;
    }

    wasmReady = true;
    wasmError = '';
    console.log('[html-to-md] WASM loaded successfully');
  } catch (err: any) {
    wasmError = `WASM init error: ${err.message || err}`;
    console.error('[html-to-md]', wasmError, err);
  }
}

function convertHTML(html: string, domain?: string): { markdown: string; error: string } {
  if (!wasmReady) {
    return { markdown: '', error: wasmError || 'WASM not ready' };
  }
  try {
    const result = (globalThis as any).convertHTMLToMarkdown(html, domain || '');
    return {
      markdown: result.markdown,
      error: result.error,
    };
  } catch (err: any) {
    return { markdown: '', error: `Conversion error: ${err.message || err}` };
  }
}

chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  if (message.type === 'convert') {
    const result = convertHTML(message.html, message.domain);
    sendResponse(result);
    return true;
  }
  if (message.type === 'ping') {
    sendResponse({ ready: wasmReady, error: wasmError });
    return true;
  }
});

initWasm();
