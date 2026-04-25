'use client';

import { useState } from 'react';
import { toSlug } from '@/lib/slug';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}

export default function ShareLinkModal({ teacherId, teacherName, onClose }: Props) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://saderot.com';
  const slug = toSlug(teacherName);
  const link = slug ? `${origin}/${slug}` : `${origin}/join/${teacherId}`;
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  function copy() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    const el = document.createElement('textarea');
    el.value = link;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{t('teacher.studentLoginLink')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-gray-500">{t('teacher.shareLinkDesc')}</p>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <span className="text-sm text-gray-700 truncate flex-1 select-all">{link}</span>
          <button
            onClick={copy}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap flex-shrink-0"
          >
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}
