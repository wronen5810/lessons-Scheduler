'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Lang, type TranslationKey, translate } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('ls_lang') as Lang | null;
    if (saved === 'en' || saved === 'he') setLangState(saved);
  }, []);

  useEffect(() => {
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('ls_lang', l);
  }

  const t = (key: TranslationKey, vars?: Record<string, string>) =>
    translate(lang, key, vars);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'he' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
