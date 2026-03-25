import './style.css';
import { type Locale, type MessageKey, detectLocale, loadLocale, saveLocale, t, toggleLocale } from '../../utils/i18n';
import { getAutoDownload, setAutoDownload } from '../../utils/settings';

const settingAutoDownload = document.getElementById('setting-auto-download') as HTMLInputElement;
const settingLang = document.getElementById('setting-lang') as HTMLButtonElement;

let locale: Locale = detectLocale();

function applyLocale() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as MessageKey;
    el.textContent = t(locale, key);
  });
  settingLang.textContent = locale === 'zh' ? 'English' : '中文';
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}

settingAutoDownload.addEventListener('change', () => {
  setAutoDownload(settingAutoDownload.checked);
});

settingLang.addEventListener('click', () => {
  locale = toggleLocale(locale);
  saveLocale(locale);
  applyLocale();
});

// --- Init ---
(async () => {
  locale = await loadLocale();
  settingAutoDownload.checked = await getAutoDownload();
  applyLocale();
})();
