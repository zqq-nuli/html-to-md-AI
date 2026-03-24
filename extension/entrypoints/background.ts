export default defineBackground(() => {
  let offscreenCreated = false;

  async function ensureOffscreen() {
    if (offscreenCreated) return;
    try {
      await (chrome.offscreen as any).createDocument({
        url: '/offscreen.html',
        reasons: ['WORKERS' as any],
        justification: 'Load Go WASM for HTML-to-Markdown conversion',
      });
      offscreenCreated = true;
    } catch {
      offscreenCreated = true;
    }
  }

  function sendToOffscreen(message: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (result) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(result);
        }
      });
    });
  }

  async function convertViaOffscreen(
    html: string,
    domain: string,
  ): Promise<{ markdown: string; error: string }> {
    await ensureOffscreen();

    // Wait for WASM to be ready (retry up to 15 times with 500ms delay)
    let lastPing: any = null;
    for (let i = 0; i < 15; i++) {
      lastPing = await sendToOffscreen({ type: 'ping' });
      if (lastPing?.ready) break;
      if (lastPing?.error) {
        // WASM failed to load, no point retrying
        return { markdown: '', error: `WASM load failed: ${lastPing.error}` };
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    if (!lastPing?.ready) {
      return { markdown: '', error: `WASM not ready after retries. Last ping: ${JSON.stringify(lastPing)}` };
    }

    const result = await sendToOffscreen({ type: 'convert', html, domain });
    return result || { markdown: '', error: 'No response from WASM converter' };
  }

  // Send message to content script, with auto-injection fallback
  function sendToTab(tabId: number, message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, async (response) => {
        if (chrome.runtime.lastError) {
          // Content script not injected — inject it
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content-scripts/content.js'],
            });
            await new Promise((r) => setTimeout(r, 100));
            chrome.tabs.sendMessage(tabId, message, (retryResponse) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve(retryResponse);
              }
            });
          } catch (err: any) {
            reject(err);
          }
        } else {
          resolve(response);
        }
      });
    });
  }

  // Handle messages from popup
  chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
    if (message.type === 'convertPage' || message.type === 'convertSelection') {
      (async () => {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            sendResponse({ markdown: '', error: 'No active tab' });
            return;
          }

          const msgType = message.type === 'convertSelection' ? 'getSelection' : 'getHTML';
          const results = await sendToTab(tab.id, { type: msgType });

          if (!results?.html) {
            sendResponse({ markdown: '', error: 'Could not extract HTML from page' });
            return;
          }

          const domain = new URL(tab.url || '').origin;
          const result = await convertViaOffscreen(results.html, domain);
          sendResponse({ ...result, title: results.title || tab.title || '' });
        } catch (err: any) {
          sendResponse({ markdown: '', error: err.message || 'Conversion failed' });
        }
      })();
      return true;
    }
  });

  // Context menus — removeAll first to avoid duplicate errors on service worker restart
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'convert-selection',
      title: 'Convert selection to Markdown',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'convert-page',
      title: 'Convert page to Markdown',
      contexts: ['page'],
    });
  });

  // Shared convert-and-show logic for shortcut & context menu
  async function convertAndShow(tabId: number, extractType: 'getHTML' | 'getSelection') {
    await sendToTab(tabId, { type: 'showToast', text: '⚡ Converting to Markdown...' });

    const results = await sendToTab(tabId, { type: extractType });
    if (!results?.html) {
      await sendToTab(tabId, { type: 'showToast', text: '❌ Could not extract HTML' });
      return;
    }

    const tab = await chrome.tabs.get(tabId);
    const domain = new URL(tab.url || '').origin;
    const converted = await convertViaOffscreen(results.html, domain);

    if (converted.error) {
      await sendToTab(tabId, { type: 'showToast', text: `❌ ${converted.error}` });
      return;
    }

    await sendToTab(tabId, {
      type: 'showResultModal',
      markdown: converted.markdown,
      title: results.title || tab.title || '',
    });
  }

  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;
    if (info.menuItemId === 'convert-selection' || info.menuItemId === 'convert-page') {
      const extractType = info.menuItemId === 'convert-selection' ? 'getSelection' : 'getHTML';
      try {
        await convertAndShow(tab.id, extractType as 'getHTML' | 'getSelection');
      } catch (err: any) {
        console.error('[html-to-md] Context menu error:', err);
      }
    }
  });

  // Keyboard shortcut
  chrome.commands.onCommand.addListener(async (command) => {
    console.log('[html-to-md] Command received:', command);
    if (command === 'convert-page') {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        console.error('[html-to-md] No active tab for shortcut');
        return;
      }
      try {
        await convertAndShow(tab.id, 'getHTML');
      } catch (err: any) {
        console.error('[html-to-md] Shortcut error:', err);
        try {
          await sendToTab(tab.id, { type: 'showToast', text: `❌ ${err.message}` });
        } catch { /* ignore */ }
      }
    }
  });

  console.log('[html-to-md] Background ready');
});
