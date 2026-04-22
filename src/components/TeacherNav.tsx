'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import ShareLinkModal from '@/components/ShareLinkModal';

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
        <Link href="/teacher" className="text-lg font-bold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">{title ?? 'Lessons Scheduler'}</Link>
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <Link href="/teacher/schedule" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('teacher.schedule')}</Link>
          <Link href="/teacher/students" className="text-sm text-slate-600 hover:text-blue-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">{t('common.students')}</Link>
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
