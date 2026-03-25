export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    const STORAGE_KEY = 'html-to-md-auto-download';

    function getAutoDownload(): boolean {
      try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
    }
    function setAutoDownload(v: boolean) {
      try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* ignore */ }
    }

    function makeFilename(title: string): string {
      const clean = (title || 'page')
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80);
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      return `${clean}-${ts}.md`;
    }

    function downloadMarkdown(markdown: string, title: string) {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = makeFilename(title);
      a.click();
      URL.revokeObjectURL(url);
    }

    function isZh(): boolean {
      try {
        const saved = localStorage.getItem('html-to-md-locale');
        if (saved) return saved === 'zh';
      } catch { /* ignore */ }
      return (navigator.language || '').startsWith('zh');
    }

    const MODAL_STYLES = `
      :host {
        all: initial;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      .overlay {
        position: fixed; inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(6px);
        animation: fadeIn 0.2s ease;
      }

      .dialog {
        position: relative;
        background: #0c0c18;
        color: #e8e8f0;
        border: 1px solid #252540;
        border-radius: 14px;
        width: 600px;
        max-width: 92vw;
        max-height: 82vh;
        display: flex;
        flex-direction: column;
        box-shadow:
          0 0 0 1px rgba(0, 229, 160, 0.06),
          0 24px 80px rgba(0, 0, 0, 0.7),
          0 0 120px rgba(0, 229, 160, 0.04);
        animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }

      /* --- Header --- */
      .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 18px 22px 14px;
        background: linear-gradient(180deg, rgba(0, 229, 160, 0.04) 0%, transparent 100%);
        border-bottom: 1px solid #1c1c30;
      }
      .brand {
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 17px;
        font-weight: 700;
        color: #e8e8f0;
        letter-spacing: -0.3px;
      }
      .brand .arrow { color: #00e5a0; margin: 0 1px; }
      .page-title {
        font-size: 12px;
        color: #6a6a85;
        margin-top: 4px;
        max-width: 340px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .stats {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        color: #555570;
        text-align: right;
        line-height: 1.7;
      }
      .stats .num { color: #00e5a0; font-weight: 600; }

      /* --- Body --- */
      .body {
        flex: 1;
        padding: 14px 22px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow: hidden;
        min-height: 0;
      }

      textarea {
        flex: 1;
        min-height: 220px;
        max-height: 52vh;
        background: #0f0f1c;
        color: #c8c8e0;
        border: 1px solid #1e1e35;
        border-radius: 10px;
        padding: 14px 16px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', monospace;
        font-size: 12px;
        line-height: 1.65;
        resize: none;
        outline: none;
        overflow-y: auto;
        tab-size: 2;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      textarea:focus {
        border-color: #00e5a0;
        box-shadow: 0 0 0 3px rgba(0, 229, 160, 0.1);
      }
      textarea::-webkit-scrollbar { width: 5px; }
      textarea::-webkit-scrollbar-track { background: transparent; }
      textarea::-webkit-scrollbar-thumb { background: #252540; border-radius: 4px; }
      textarea::-webkit-scrollbar-thumb:hover { background: #3a3a55; }

      /* --- Checkbox row --- */
      .option-label {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #111120;
        border: 1px solid #1a1a30;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.15s;
        font-size: 12.5px;
        color: #8888a0;
        user-select: none;
        line-height: 1.4;
      }
      .option-label:hover { border-color: #2a2a48; color: #b0b0c8; }

      input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border: 2px solid #3a3a55;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
        transition: all 0.15s;
      }
      input[type="checkbox"]:checked {
        background: #00e5a0;
        border-color: #00e5a0;
      }
      input[type="checkbox"]:checked::after {
        content: '';
        position: absolute;
        left: 5px;
        top: 1px;
        width: 5px;
        height: 10px;
        border: solid #0c0c18;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      /* --- Footer --- */
      .footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 22px;
        border-top: 1px solid #1c1c30;
        background: rgba(0, 0, 0, 0.15);
      }

      button {
        padding: 9px 22px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s ease;
        font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
        line-height: 1;
      }

      .btn-copy, .btn-cancel {
        background: #161628;
        color: #9898b0;
        border-color: #252540;
      }
      .btn-copy:hover, .btn-cancel:hover {
        background: #1e1e35;
        color: #e0e0f0;
        border-color: #3a3a55;
      }

      .btn-confirm {
        background: linear-gradient(135deg, #00c88a, #00a870);
        color: #0a0a12;
        border: none;
        padding: 9px 28px;
      }
      .btn-confirm:hover {
        background: linear-gradient(135deg, #00e5a0, #00c88a);
        box-shadow: 0 0 20px rgba(0, 229, 160, 0.25), 0 2px 8px rgba(0, 0, 0, 0.3);
        transform: translateY(-1px);
      }
      .btn-confirm:active { transform: translateY(0); }

      /* --- Animations --- */
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;

    function showResultModal(markdown: string, title: string) {
      const zh = isZh();

      if (getAutoDownload()) {
        downloadMarkdown(markdown, title);
        showToast(zh ? '✅ 已自动下载 Markdown 文件' : '✅ Markdown file auto-downloaded');
        return;
      }

      // Remove existing host if any
      document.getElementById('html-to-md-host')?.remove();

      // Create Shadow DOM host
      const host = document.createElement('div');
      host.id = 'html-to-md-host';
      host.style.cssText = 'all:initial; position:fixed; inset:0; z-index:2147483647; display:block;';
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'closed' });

      const style = document.createElement('style');
      style.textContent = MODAL_STYLES;
      shadow.appendChild(style);

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;';

      const charCount = markdown.length.toLocaleString();
      const lineCountNum = markdown.split('\n').length.toLocaleString();
      const safeTitle = (title || document.title).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      wrapper.innerHTML = `
        <div class="overlay"></div>
        <div class="dialog">
          <div class="header">
            <div>
              <div class="brand">⚡ html<span class="arrow">→</span>md</div>
              <div class="page-title">${safeTitle}</div>
            </div>
            <div class="stats">
              <span class="num">${charCount}</span> ${zh ? '字符' : 'chars'}<br/>
              <span class="num">${lineCountNum}</span> ${zh ? '行' : 'lines'}
            </div>
          </div>
          <div class="body">
            <textarea spellcheck="false" readonly></textarea>
            <label class="option-label">
              <input type="checkbox" id="htmd-cb" />
              ${zh ? '以后不再弹出，自动下载 Markdown 文件' : "Don't show again — auto-download .md file next time"}
            </label>
          </div>
          <div class="footer">
            <button class="btn-copy">📋 ${zh ? '复制' : 'Copy'}</button>
            <button class="btn-cancel">${zh ? '取消' : 'Cancel'}</button>
            <button class="btn-confirm">💾 ${zh ? '下载' : 'Download'}</button>
          </div>
        </div>
      `;

      shadow.appendChild(wrapper);

      // Set textarea value directly (avoids HTML escaping issues)
      const textarea = shadow.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = markdown;

      const checkbox = shadow.querySelector('#htmd-cb') as HTMLInputElement;
      const overlayEl = shadow.querySelector('.overlay') as HTMLElement;

      function close() {
        host.style.opacity = '0';
        host.style.transition = 'opacity 0.15s';
        setTimeout(() => host.remove(), 150);
        document.removeEventListener('keydown', onKey);
      }

      shadow.querySelector('.btn-copy')!.addEventListener('click', () => {
        navigator.clipboard.writeText(markdown).then(() => {
          const btn = shadow.querySelector('.btn-copy') as HTMLButtonElement;
          btn.textContent = zh ? '✅ 已复制' : '✅ Copied';
          setTimeout(() => { btn.textContent = `📋 ${zh ? '复制' : 'Copy'}`; }, 1500);
        });
      });

      shadow.querySelector('.btn-cancel')!.addEventListener('click', close);

      shadow.querySelector('.btn-confirm')!.addEventListener('click', () => {
        if (checkbox.checked) setAutoDownload(true);
        downloadMarkdown(markdown, title || document.title);
        close();
      });

      overlayEl.addEventListener('click', close);

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close();
      };
      document.addEventListener('keydown', onKey);
    }

    // --- Keyboard shortcut (fallback for when chrome.commands doesn't fire) ---
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        chrome.runtime.sendMessage({ type: 'convertPage' });
      }
    });

    // --- Message handler ---
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
      if (message.type === 'getHTML') {
        const main =
          document.querySelector('main') ||
          document.querySelector('article') ||
          document.querySelector('[role="main"]') ||
          document.querySelector('.content') ||
          document.querySelector('#content') ||
          document.body;
        sendResponse({ html: main.innerHTML, title: document.title });
        return true;
      }

      if (message.type === 'getSelection') {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          sendResponse({ html: '', title: document.title });
          return true;
        }
        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        sendResponse({ html: container.innerHTML, title: document.title });
        return true;
      }

      if (message.type === 'copyToClipboard') {
        navigator.clipboard.writeText(message.text).then(() => {
          showToast('✅ Markdown copied to clipboard!');
          sendResponse({ success: true });
        });
        return true;
      }

      if (message.type === 'showToast') {
        showToast(message.text);
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'showResultModal') {
        showResultModal(message.markdown, message.title);
        sendResponse({ success: true });
        return true;
      }
    });

    function showToast(text: string) {
      // Toast also uses Shadow DOM for isolation
      const toastHost = document.createElement('div');
      toastHost.style.cssText = 'all:initial; position:fixed; bottom:24px; right:24px; z-index:2147483647;';
      const toastShadow = toastHost.attachShadow({ mode: 'closed' });
      toastShadow.innerHTML = `
        <style>
          :host { all: initial; }
          div {
            background: #0e0e1a;
            color: #e0e0f0;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-family: -apple-system, 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,160,0.1);
            border: 1px solid #1e1e35;
            animation: toastIn 0.3s ease;
            opacity: 1;
            transition: opacity 0.3s;
          }
          @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        <div>${text}</div>
      `;
      document.body.appendChild(toastHost);
      setTimeout(() => {
        const inner = toastShadow.querySelector('div') as HTMLElement;
        if (inner) inner.style.opacity = '0';
        setTimeout(() => toastHost.remove(), 300);
      }, 2500);
    }
  },
});
