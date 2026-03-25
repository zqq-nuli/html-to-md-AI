import './style.css';
import { type Locale, type MessageKey, detectLocale, loadLocale, saveLocale, t, toggleLocale } from '../../utils/i18n';

const btnPage = document.getElementById('btn-page') as HTMLButtonElement;
const btnSelection = document.getElementById('btn-selection') as HTMLButtonElement;
const btnCopy = document.getElementById('btn-copy') as HTMLButtonElement;
const btnDownload = document.getElementById('btn-download') as HTMLButtonElement;
const btnSettings = document.getElementById('btn-settings') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const outputArea = document.getElementById('output-area') as HTMLDivElement;
const outputEl = document.getElementById('output') as HTMLTextAreaElement;
const outputTitle = document.getElementById('output-title') as HTMLSpanElement;
const charCount = document.getElementById('char-count') as HTMLSpanElement;
const lineCount = document.getElementById('line-count') as HTMLSpanElement;

let lastTitle = '';
let locale: Locale = detectLocale();

function applyLocale() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as MessageKey;
    el.textContent = t(locale, key);
  });
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  updateMeta();
}

function setStatus(type: 'loading' | 'error' | 'success' | 'hidden', text = '') {
  statusEl.className = `status ${type}`;
  if (type === 'hidden') {
    statusEl.classList.add('hidden');
  } else {
    statusEl.classList.remove('hidden');
    statusEl.textContent = text;
  }
}

function showOutput(markdown: string, title: string) {
  lastTitle = title;
  outputArea.classList.remove('hidden');
  outputEl.value = markdown;
  outputEl.removeAttribute('readonly');
  outputTitle.textContent = title || 'Converted';
  updateMeta();
}

function updateMeta() {
  const text = outputEl.value;
  charCount.textContent = `${text.length} ${t(locale, 'chars')}`;
  lineCount.textContent = `${text.split('\n').length} ${t(locale, 'lines')}`;
}

async function convert(type: 'convertPage' | 'convertSelection') {
  btnPage.disabled = true;
  btnSelection.disabled = true;
  const loadingText = type === 'convertPage' ? t(locale, 'converting') : t(locale, 'convertingSelection');
  setStatus('loading', loadingText);
  outputArea.classList.add('hidden');

  try {
    const response = await browser.runtime.sendMessage({ type });

    if (response?.error) {
      setStatus('error', response.error);
      return;
    }

    if (!response?.markdown) {
      setStatus('error', t(locale, 'noContent'));
      return;
    }

    setStatus('success', `${t(locale, 'done')} — ${response.markdown.length} ${t(locale, 'chars')}`);
    showOutput(response.markdown, response.title || '');

    setTimeout(() => setStatus('hidden'), 2000);
  } catch (err: any) {
    setStatus('error', err.message || t(locale, 'conversionFailed'));
  } finally {
    btnPage.disabled = false;
    btnSelection.disabled = false;
  }
}

// --- Event listeners ---

btnSettings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

btnPage.addEventListener('click', () => convert('convertPage'));
btnSelection.addEventListener('click', () => convert('convertSelection'));

btnCopy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value);
    const original = btnCopy.textContent;
    btnCopy.textContent = '✅';
    setTimeout(() => (btnCopy.textContent = original), 1200);
  } catch {
    outputEl.select();
    document.execCommand('copy');
  }
});

btnDownload.addEventListener('click', () => {
  const blob = new Blob([outputEl.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = (lastTitle || 'converted')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || 'page'}.md`;
  a.click();
  URL.revokeObjectURL(url);
});

outputEl.addEventListener('input', updateMeta);

// --- Async init ---
(async () => {
  locale = await loadLocale();
  applyLocale();
})();
