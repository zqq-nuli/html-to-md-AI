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
  },
} as const;

export type MessageKey = keyof (typeof messages)['en'];

const STORAGE_KEY = 'html-to-md-locale';

export function detectLocale(): Locale {
  // Check saved preference first
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'en' || saved === 'zh') return saved;

  // Browser language detection
  const lang = navigator.language || navigator.languages?.[0] || 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

export function saveLocale(locale: Locale) {
  localStorage.setItem(STORAGE_KEY, locale);
}

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key];
}

export function toggleLocale(current: Locale): Locale {
  return current === 'en' ? 'zh' : 'en';
}
