import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, isLanguage, type Language } from "../../shared/personaIds";
import { STRINGS, type Strings } from "./strings";

const STORAGE_KEY = "soulom.lang.v1";

function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Storage blocked: fall through to the browser's language.
  }
  const browserLanguage = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "";
  if (browserLanguage.startsWith("th")) return "th";
  return browserLanguage ? "en" : DEFAULT_LANGUAGE;
}

interface I18nValue {
  language: Language;
  t: Strings;
  setLanguage: (language: Language) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit.
    }
  }, []);

  const value = useMemo(() => ({ language, t: STRINGS[language], setLanguage }), [language, setLanguage]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
