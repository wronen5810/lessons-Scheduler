'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createBrowserSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setTeacherId(data.user.id);
    });
    fetch('/api/teacher/me/subscription').then(r => r.json()).then(data => {
      if (data.teacher?.name) setTeacherName(data.teacher.name);
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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/teacher" className="text-lg font-bold text-gray-900 tracking-tight hover:text-blue-600 transition-colors">
          {title ?? 'Lessons Scheduler'}
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />

          {/* Menu dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-gray-200 transition-colors"
            >
              {t('common.menu')}
              <svg className={`w-4 h-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute end-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                <Link href="/teacher" onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  🏠 {t('common.home')}
                </Link>
                <Link href="/teacher/schedule" onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  📅 {t('teacher.schedule')}
                </Link>
                <Link href="/teacher/students" onClick={closeMenu}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  👥 {t('common.students')}
                </Link>
                {features.billing && (
                  <Link href="/teacher/billing" onClick={closeMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    💰 {t('teacher.billing')}
                  </Link>
                )}
                {features.messages && (
                  <Link href="/teacher/messages" onClick={closeMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    💬 {t('teacher.messages')}
                  </Link>
                )}
                <button onClick={() => { setShowShareLink(true); closeMenu(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  🔗 {t('teacher.shareLink')}
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  🚪 {t('common.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showShareLink && teacherId && (
        <ShareLinkModal teacherId={teacherId} teacherName={teacherName} onClose={() => setShowShareLink(false)} />
      )}
    </>
  );
}
