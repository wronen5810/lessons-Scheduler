'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

function TeacherIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-100 flex items-center justify-center text-5xl sm:text-6xl">
        📓
      </div>
    </div>
  );
}

function StudentIllustration() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-purple-100 flex items-center justify-center text-5xl sm:text-6xl">
        🎧
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const type = params.get('type');
    if (access_token && refresh_token && type === 'magiclink') {
      const supabase = createBrowserSupabase();
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (!error) router.replace('/teacher');
      });
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-10">

      <div className="w-full max-w-2xl flex justify-end mb-2">
        <LanguageToggle />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('landing.title')}</h1>
        <p className="text-base sm:text-lg text-gray-500">{t('landing.howJoining')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl">

        <Link
          href="/student"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-transparent hover:border-blue-300 px-3 py-5 sm:p-8 flex flex-col items-center text-center transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-24 sm:w-40 sm:h-44 mb-3 sm:mb-6 transition-transform duration-200 group-hover:scale-105">
            <StudentIllustration />
          </div>
          <h2 className="text-sm sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">{t('landing.student')}</h2>
          <p className="hidden sm:block text-sm text-gray-500 mb-6">{t('landing.studentDesc')}</p>
          <span className="inline-block bg-blue-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl group-hover:bg-blue-700 transition-colors">
            {t('landing.bookLesson')}
          </span>
        </Link>

        <Link
          href="/teacher/login"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-transparent hover:border-indigo-300 px-3 py-5 sm:p-8 flex flex-col items-center text-center transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-24 sm:w-40 sm:h-44 mb-3 sm:mb-6 transition-transform duration-200 group-hover:scale-105">
            <TeacherIllustration />
          </div>
          <h2 className="text-sm sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">{t('landing.teacher')}</h2>
          <p className="hidden sm:block text-sm text-gray-500 mb-6">{t('landing.teacherDesc')}</p>
          <span className="inline-block bg-indigo-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl group-hover:bg-indigo-700 transition-colors">
            {t('landing.dashboard')}
          </span>
        </Link>

      </div>

      <p className="mt-6 text-sm text-gray-500">
        {t('landing.newTeacher')}{' '}
        <Link href="/subscribe" className="text-indigo-600 hover:underline font-medium">
          {t('landing.requestSubscription')}
        </Link>
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600 hover:underline">{t('common.privacyPolicy')}</Link>
        <span aria-hidden>·</span>
        <Link href="/terms-of-service" className="hover:text-gray-600 hover:underline">{t('common.termsOfService')}</Link>
        <span aria-hidden>·</span>
        <Link href="/refund-policy" className="hover:text-gray-600 hover:underline">{t('common.refundPolicy')}</Link>
      </div>

    </div>
  );
}
