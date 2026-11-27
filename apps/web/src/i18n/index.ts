/**
 * Tiny i18n for the phone simple mode. No library: a Korean and an English table (messages.ts), a persisted
 * locale, and `t()` with {name} placeholders. Default: Korean when the browser language is Korean.
 * The full editor stays English; this is the place to grow it if more of the PC UI gets Korean.
 */
import { create } from "zustand";
import { en, ko, type MessageKey } from "./messages";

export type Locale = "ko" | "en";
export type { MessageKey };
const STORAGE_KEY = "openreel.locale";
const TABLES: Record<Locale, Record<MessageKey, string>> = { ko, en };

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "ko" || saved === "en") return saved;
  } catch { /* storage blocked */ }
  if (typeof navigator !== "undefined" && /^ko\b/i.test(navigator.language || "")) return "ko";
  // The phone mode exists for a Korean user; English is one tap away in its menu.
  return "ko";
}

interface LocaleState { locale: Locale; setLocale: (locale: Locale) => void }
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: initialLocale(),
  setLocale: (locale) => {
    try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* not remembered */ }
    if (typeof document !== "undefined") document.documentElement.lang = locale;
    set({ locale });
  },
}));

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  let text = TABLES[locale][key] ?? en[key] ?? key;
  if (vars) for (const [name, value] of Object.entries(vars)) text = text.split(`{${name}}`).join(String(value));
  return text;
}

/** Non-React callers (toasts from async code). */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  return translate(useLocaleStore.getState().locale, key, vars);
}

export function useT(): (key: MessageKey, vars?: Record<string, string | number>) => string {
  const locale = useLocaleStore((s) => s.locale);
  return (key, vars) => translate(locale, key, vars);
}
