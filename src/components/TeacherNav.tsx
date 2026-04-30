'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import { translate } from '@/lib/i18n';
import LanguageToggle from '@/components/LanguageToggle';
import { useTeacherSettings } from '@/lib/useTeacherSettings';
import ShareLinkModal from '@/components/ShareLinkModal';
import TeacherSettingsModal from '@/components/TeacherSettingsModal';
import SaderotLogo from '@/components/SaderotLogo';
import {
  Calendar, Users, Users2, CreditCard, MessageSquare, Share2,
  Settings, LogOut, Clock, UserCircle,
} from 'lucide-react';

export default function TeacherNav({ title, nextLesson }: { title?: string; nextLesson?: { hours: number; minutes: number } | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const { settings, save: saveSettings } = useTeacherSettings();
  const features = settings.features;
  const [teacherId, setTeacherId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'profile'>('general');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
    fetch('/api/teacher/me/subscription').then(r => r.json()).then(data => {
      if (data.teacher?.name) setTeacherName(data.teacher.name);
    }).catch(() => {});
    fetch('/api/teacher/requests').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPendingCount(data.length);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function handleSignOut() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push('/teacher/login');
  }

  function closeMenu() { setMenuOpen(false); }

  // Derive page title from current route
  const pageTitles: Record<string, string> = {
    '/teacher/schedule': t('teacher.schedule'),
    '/teacher/students': t('common.students'),
    '/teacher/billing': t('teacher.billing'),
    '/teacher/messages': t('teacher.messages'),
  };
  const pageTitle = title ?? pageTitles[pathname] ?? '';

  const isDashboard = pathname === '/teacher';

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        {/* Logo + page title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/teacher" className="hover:opacity-80 transition-opacity">
            <SaderotLogo size="sm" />
          </Link>
          {pageTitle && !isDashboard && (
            <>
              <span className="text-gray-200 select-none hidden sm:block">·</span>
              <span className="text-sm font-medium text-gray-500 hidden sm:block">{pageTitle}</span>
            </>
          )}
        </div>

        {/* Next lesson message - centered, desktop only */}
        <div className="hidden sm:flex flex-1 justify-center min-w-0">
          {nextLesson && (
            <span className="text-xs font-medium text-blue-600 min-w-0 text-center leading-tight flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {translate(lang, 'teacher.nextLesson', { hours: String(nextLesson.hours), minutes: String(nextLesson.minutes) })}
            </span>
          )}
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 sm:hidden" />

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Profile shortcut */}
          <button
            onClick={() => { setSettingsTab('profile'); setShowSettings(true); }}
            title="Profile"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
          </button>

          {/* Menu dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              <span className="relative">
                {t('common.menu')}
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              <svg className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute end-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                <Link href="/teacher/schedule" onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  {t('teacher.schedule')}
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                  )}
                </Link>
                <Link href="/teacher/students" onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  {t('common.students')}
                </Link>
                {features.groups && (
                  <Link href="/teacher/students?tab=groups" replace onClick={closeMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    <Users2 className="w-4 h-4 flex-shrink-0" />
                    {t('common.groups')}
                  </Link>
                )}
                {features.billing && (
                  <Link href="/teacher/billing" onClick={closeMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    {t('teacher.billing')}
                  </Link>
                )}
                {features.messages && (
                  <Link href="/teacher/messages" onClick={closeMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    {t('teacher.messages')}
                  </Link>
                )}
                <button onClick={() => { setShowShareLink(true); closeMenu(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Share2 className="w-4 h-4 flex-shrink-0" />
                  {t('teacher.shareLink')}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={() => { setSettingsTab('general'); setShowSettings(true); closeMenu(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Settings className="w-4 h-4 flex-shrink-0" />
                  {t('common.settings')}
                </button>
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4 flex-shrink-0" />
                  {t('common.signOut')}
                </button>
              </div>
            )}
          </div>

          <LanguageToggle />
        </div>
      </header>

      {/* Next lesson banner - mobile only, hidden on dashboard (dashboard has its own hero card) */}
      {nextLesson && !isDashboard && (
        <div className="sm:hidden bg-blue-50 border-b border-blue-100 px-4 py-1.5 text-center">
          <span className="text-xs font-medium text-blue-700 whitespace-nowrap inline-flex items-center gap-1 justify-center">
            <Clock className="w-3 h-3" />
            {translate(lang, 'teacher.nextLessonBanner', { hours: String(nextLesson.hours), minutes: String(nextLesson.minutes) })}
          </span>
        </div>
      )}

      {showShareLink && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShareLink(false)} />
      )}
      {showSettings && (
        <TeacherSettingsModal settings={settings} onSave={saveSettings} onClose={() => setShowSettings(false)} initialTab={settingsTab} />
      )}
    </>
  );
}
