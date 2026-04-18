'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
      className={`text-sm px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium ${className}`}
      title={lang === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      {lang === 'en' ? 'עב' : 'EN'}
    </button>
  );
}
