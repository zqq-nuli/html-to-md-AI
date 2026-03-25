export type Locale = 'en' | 'zh';

const messages = {
  en: {
    convertPage: 'Convert Page',
    convertSelection: 'Convert Selection',
    converting: 'Converting page...',
    convertingSelection: 'Converting selection...',
    done: 'Done',
    chars: 'chars',
    lines: 'lines',
    noContent: 'No content extracted',
    conversionFailed: 'Conversion failed',
    noActiveTab: 'No active tab',
    copied: 'Copied!',
    quickConvert: 'quick convert',
    langSwitch: '中',
    copiedToast: 'Markdown copied to clipboard!',
    settings: 'Settings',
    autoDownload: 'Auto-download',
    autoDownloadDesc: 'Download .md file directly, skip preview',
    shortcutLabel: 'Keyboard shortcut',
    shortcutDesc: 'Press on any page to convert instantly',
    language: 'Language',
    languageDesc: 'Switch interface language',
  },
  zh: {
    convertPage: '转换整页',
    convertSelection: '转换选中',
    converting: '正在转换页面...',
    convertingSelection: '正在转换选中内容...',
    done: '完成',
    chars: '字符',
    lines: '行',
    noContent: '未提取到内容',
    conversionFailed: '转换失败',
    noActiveTab: '没有活跃标签页',
    copied: '已复制!',
    quickConvert: '快速转换',
    langSwitch: 'EN',
    copiedToast: 'Markdown 已复制到剪贴板!',
    settings: '设置',
    autoDownload: '自动下载',
    autoDownloadDesc: '转换后直接下载，跳过预览弹窗',
    shortcutLabel: '键盘快捷键',
    shortcutDesc: '在任意页面按下即可快速转换',
    language: '语言',
    languageDesc: '切换界面语言',
  },
} as const;

export type MessageKey = keyof (typeof messages)['en'];

const STORAGE_KEY = 'html-to-md-locale';

/** Synchronous fallback — browser language only */
export function detectLocale(): Locale {
  const lang = navigator.language || navigator.languages?.[0] || 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

/** Async load from chrome.storage.local, falling back to browser language */
export async function loadLocale(): Promise<Locale> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const saved = result[STORAGE_KEY];
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    /* ignore */
  }
  return detectLocale();
}

export async function saveLocale(locale: Locale) {
  await chrome.storage.local.set({ [STORAGE_KEY]: locale });
}

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function toggleLocale(current: Locale): Locale {
  return current === 'en' ? 'zh' : 'en';
}
