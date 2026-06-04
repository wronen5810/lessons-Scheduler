'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import QuickActionsWizard from '@/components/QuickActionsWizard';
import { toSlug } from '@/lib/slug';
import { Settings, CreditCard } from 'lucide-react';

export default function TeacherDashboard() {
  const { settings, loading, save: saveSettings } = useTeacherSettings();
  const { t, lang, isRTL } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [nextLesson, setNextLesson] = useState<{ hours: number; minutes: number; start_time?: string; student_name?: string } | null>(null);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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

  function copyShareLink() {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://saderot.com';
    const slug = toSlug(teacherName);
    const link = slug ? `${origin}/${slug}` : teacherId ? `${origin}/join/${teacherId}` : '';
    if (!link) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      }).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      const el = document.createElement('textarea');
      el.value = link;
      el.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  // Don't block the entire page on settings load — render immediately with defaults.
  // Settings (feature flags, display preferences) are non-critical for initial paint.

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
            <p className="text-sm font-semibold opacity-80">
              {teacherName ? `Welcome back, ${teacherName}!` : t('teacher.welcomeBack')}
            </p>
            <p className="text-lg font-bold mt-0.5 opacity-90">{t('teacher.whatToDoToday')}</p>
            <Link href="/teacher/schedule"
              className="inline-flex items-center gap-1 mt-3 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
              {t('teacher.schedule')} →
            </Link>
          </div>
        )}

        {/* Summary rows — 3 across × 2 rows */}
        <div className="grid grid-cols-3 gap-3">
          {/* Row 1: stats */}
          <Link href="/teacher/schedule" className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center transition-colors hover:border-blue-300">
            {todayCount === null
              ? <div className="h-8 w-10 bg-gray-200 rounded-md animate-pulse mx-auto" />
              : <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
            }
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('teacher.todayLessons')}</p>
          </Link>
          <Link href="/teacher/schedule" className={`bg-white rounded-xl border shadow-sm p-3 text-center transition-colors hover:border-amber-300 ${pendingCount ? 'border-amber-200' : 'border-gray-100'}`}>
            {pendingCount === null
              ? <div className="h-8 w-10 bg-gray-200 rounded-md animate-pulse mx-auto" />
              : <p className={`text-2xl font-bold ${pendingCount ? 'text-amber-500' : 'text-gray-400'}`}>{pendingCount}</p>
            }
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('teacher.pendingRequests')}</p>
          </Link>
          <Link href="/teacher/students" className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center transition-colors hover:border-blue-300">
            {studentCount === null
              ? <div className="h-8 w-10 bg-gray-200 rounded-md animate-pulse mx-auto" />
              : <p className="text-2xl font-bold text-gray-800">{studentCount}</p>
            }
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{t('common.students')}</p>
          </Link>

          {/* Row 2: actions */}
          <button
            onClick={() => setShowSettings(true)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <Settings className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500 leading-tight text-center">{isRTL ? 'הגדרות ופרופיל' : 'Settings & Profile'}</p>
          </button>
          <Link href="/teacher/billing"
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col items-center justify-center gap-1.5 transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <CreditCard className="w-5 h-5 text-blue-500" />
            <p className="text-xs text-gray-500 leading-tight text-center">{isRTL ? 'בדוק מצב חיובים' : 'Check Billing Status'}</p>
          </Link>
        </div>

        {/* Quick action wizards */}
        <QuickActionsWizard onRefresh={() => {
          fetch('/api/teacher/students').then(r => r.json()).then(data => {
            if (Array.isArray(data)) setStudentCount(data.filter((s: { is_active: boolean }) => s.is_active).length);
          }).catch(() => {});
        }} />

        {/* Share link */}
        {(teacherId || teacherName) && (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-3">
            <p className="text-xs text-gray-400 mb-1.5">{t('teacher.copyShareLink')}</p>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-gray-700 truncate">
                {(() => {
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://saderot.com';
                  const slug = toSlug(teacherName);
                  return slug ? `${origin}/${slug}` : `${origin}/join/${teacherId}`;
                })()}
              </span>
              <button
                onClick={copyShareLink}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              >
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

      </main>

      {showSettings && (
        <TeacherSettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}
