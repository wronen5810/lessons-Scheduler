'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
      className={`flex items-center gap-0.5 text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${className}`}
      title={lang === 'en' ? 'Switch to Hebrew' : 'Switch to English'}
    >
      <span className={lang === 'en' ? 'font-bold text-gray-900' : 'text-gray-400'}>EN</span>
      <span className="text-gray-300 mx-0.5">|</span>
      <span className={lang === 'he' ? 'font-bold text-gray-900' : 'text-gray-400'}>עב</span>
    </button>
  );
}
