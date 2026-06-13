import zh from './zh';
import en from './en';

const locales: Record<string, Record<string, string>> = { zh, en };

let currentLang: string = 'zh';

export function setLanguage(lang: string) {
  currentLang = lang;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const locale = locales[currentLang] || locales['zh'];
  let text = locale[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
