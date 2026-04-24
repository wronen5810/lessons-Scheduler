'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import ShareLinkModal from '@/components/ShareLinkModal';

export default function TeacherDashboard() {
  const router = useRouter();
  const { settings, loading, save: saveSettings } = useTeacherSettings();
  const { t, lang, isRTL } = useLanguage();
  const f = settings.features;
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [nextLesson, setNextLesson] = useState<{ hours: number; minutes: number; start_time?: string; student_name?: string } | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
    fetch('/api/teacher/me/subscription').then(r => r.json()).then(data => {
      if (data.teacher?.name) setTeacherName(data.teacher.name);
    }).catch(() => {});
    fetch('/api/teacher/next-lesson').then(r => r.json()).then(data => {
      if (data.date) setNextLesson(data);
    }).catch(() => {});
    fetch('/api/teacher/requests').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPendingCount(data.length);
    }).catch(() => {});
    fetch('/api/teacher/students').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setStudentCount(data.filter((s: { is_active: boolean }) => s.is_active).length);
    }).catch(() => {});

    // Today's slot count
    const today = new Date().toISOString().slice(0, 10);
    const weekStart = getWeekStart(today);
    fetch(`/api/teacher/slots?week=${weekStart}`).then(r => r.json()).then(slots => {
      if (Array.isArray(slots)) {
        const booked = slots.filter((s: { date: string; state: string }) =>
          s.date === today && ['pending', 'confirmed', 'completed'].includes(s.state)
        ).length;
        setTodayCount(booked);
      }
    }).catch(() => {});
  }, []);

  function getWeekStart(date: string): string {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().slice(0, 10);
  }

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/teacher/login');
  }

  const quickActions = [
    { label: t('teacher.schedule'),  desc: t('teacher.scheduleDesc'),  href: '/teacher/schedule',          icon: '📅', show: true },
    { label: t('common.students'),   desc: t('teacher.studentsDesc'),  href: '/teacher/students',           icon: '👥', show: true },
    { label: t('common.groups'),     desc: t('teacher.studentsDesc'),  href: '/teacher/students?tab=groups',icon: '🫂', show: f.groups },
    { label: t('teacher.billing'),   desc: t('teacher.billingDesc'),   href: '/teacher/billing',            icon: '💰', show: f.billing },
    { label: t('teacher.messages'),  desc: t('teacher.messagesDesc'),  href: '/teacher/messages',           icon: '💬', show: f.messages },
    { label: t('common.share'),      desc: t('teacher.shareDesc'),     href: null, icon: '🔗', show: true,  onClick: () => setShowShare(true) },
    { label: t('common.settings'),   desc: t('teacher.settingsDesc'),  href: null, icon: '⚙️', show: true,  onClick: () => setShowSettings(true) },
    { label: t('common.signOut'),    desc: '',                         href: null, icon: '🚪', show: true,  onClick: handleSignOut, danger: true },
  ].filter(a => a.show);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Hero: next lesson */}
        {nextLesson ? (
          <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-md">
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{t('teacher.nextLesson').split('{')[0].trim()}</p>
            <p className="text-3xl font-bold mt-1">
              {nextLesson.hours > 0
                ? translate(lang, 'teacher.nextLesson', { hours: String(nextLesson.hours), minutes: String(nextLesson.minutes) })
                : `${nextLesson.minutes} min`}
            </p>
            {nextLesson.student_name && (
              <p className="text-sm opacity-80 mt-1">— {nextLesson.student_name}</p>
            )}
            <Link href="/teacher/schedule"
              className="inline-flex items-center gap-1 mt-3 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              {t('teacher.schedule')} →
            </Link>
          </div>
        ) : (
          <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-md">
            <p className="text-sm font-semibold opacity-80">{t('teacher.welcomeBack')}</p>
            <p className="text-lg font-bold mt-0.5 opacity-90">{t('teacher.whatToDoToday')}</p>
            <Link href="/teacher/schedule"
              className="inline-flex items-center gap-1 mt-3 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              {t('teacher.schedule')} →
            </Link>
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{todayCount ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('teacher.schedule')}</p>
          </div>
          <div className={`bg-white rounded-xl border shadow-sm p-3 text-center ${pendingCount ? 'border-amber-200' : 'border-gray-100'}`}>
            <p className={`text-2xl font-bold ${pendingCount ? 'text-amber-500' : 'text-gray-400'}`}>{pendingCount ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('teacher.pendingRequests')}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-gray-800">{studentCount ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('common.students')}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          {quickActions.map((action) => {
            const isDanger = (action as { danger?: boolean }).danger;
            const inner = (
              <div className="flex items-center gap-3 w-full">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${isDanger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0 text-start">
                  <p className={`text-sm font-semibold ${isDanger ? 'text-red-600' : 'text-gray-900'}`}>{action.label}</p>
                  {action.desc && <p className="text-xs text-gray-400 truncate">{action.desc}</p>}
                </div>
                {!isDanger && (
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
                  </svg>
                )}
              </div>
            );
            const baseCls = `flex items-center w-full bg-white border rounded-xl px-4 py-3 shadow-sm transition-all ${isDanger ? 'border-red-100 hover:border-red-200 hover:bg-red-50' : 'border-gray-100 hover:shadow-md hover:border-blue-200'}`;
            return action.href ? (
              <Link key={action.label} href={action.href} className={baseCls}>{inner}</Link>
            ) : (
              <button key={action.label} onClick={action.onClick} className={baseCls}>{inner}</button>
            );
          })}
        </div>
      </main>

      {showSettings && (
        <TeacherSettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}
      {showShare && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
