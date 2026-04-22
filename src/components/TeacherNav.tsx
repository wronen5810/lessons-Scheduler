'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { toSlug } from '@/lib/slug';
import { useTeacherSettings } from '@/lib/useTeacherSettings';

function ShareLinkModal({ teacherId, teacherName, onClose }: { teacherId: string; teacherName: string; onClose: () => void }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lessons-scheduler.com';
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

export default function TeacherNav({ title }: { title?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { settings } = useTeacherSettings();
  const features = settings.features;
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
    fetch('/api/teacher/me/subscription').then(r => r.json()).then(data => {
      if (data.teacher?.name) setTeacherName(data.teacher.name);
    }).catch(() => {});
  }, []);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/teacher/login');
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title ?? t('teacher.schedule')}</h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Link href="/teacher" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.schedule')}</Link>
          <Link href="/teacher/students" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('common.students')}</Link>
          <Link href="/teacher/templates" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.slots')}</Link>
          {features.billing && <Link href="/teacher/billing" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.billing')}</Link>}
          {features.messages && <Link href="/teacher/messages" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.messages')}</Link>}
          <button onClick={() => setShowShareLink(true)} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.shareLink')}</button>
          <LanguageToggle />
          <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('common.signOut')}</button>
        </div>
      </header>
      {showShareLink && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShareLink(false)} />
      )}
    </>
  );
}
