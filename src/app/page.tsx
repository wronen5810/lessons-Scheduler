'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      // 1. Handle magic link token in URL hash (teacher impersonation / password reset)
      const hash = window.location.hash.slice(1);
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');
        if (access_token && refresh_token && type === 'magiclink') {
          const supabase = createBrowserSupabase();
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error) { router.replace('/teacher'); return; }
        }
      }

      // 2. Restore teacher session — Supabase cookie + local session flag both present
      if (localStorage.getItem('ls_site_session')) {
        const supabase = createBrowserSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { router.replace('/teacher'); return; }
        // Cookie expired — clear the stale flag so they see the login page
        localStorage.removeItem('ls_site_session');
      }

      // 3. Restore student session
      const lastTeacherId = localStorage.getItem('last_teacher_id');
      const lastEmail = localStorage.getItem('last_student_email');
      if (lastTeacherId && localStorage.getItem(`st_${lastTeacherId}`)) {
        const url = lastEmail
          ? `/t/${lastTeacherId}?email=${encodeURIComponent(lastEmail)}`
          : `/t/${lastTeacherId}`;
        router.replace(url);
        return;
      }

      // 4. No session found — show the landing page
      setReady(true);
    }

    checkSession();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-10">

      <div className="w-full max-w-2xl flex justify-end mb-2">
        <LanguageToggle />
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <SaderotLogo size="lg" showText={false} />
        </div>
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

      <a
        href="https://play.google.com/store/apps/details?id=com.saderOT.myapp"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex items-center gap-2 bg-black text-white rounded-xl px-5 py-3 hover:bg-gray-800 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M3.18 23.76c.3.17.64.22.98.15l11.46-11.46-2.9-2.9L3.18 23.76zm15.6-13.2L16.2 9l-2.9 2.9 2.56 2.56 2.58-1.44c.74-.41.74-1.44-.26-2.46zM3 .24C2.67.41 2.4.76 2.4 1.2v21.6c0 .44.27.79.6.96l12.6-12.6L3 .24zm10.32 11.22L3.18.24c-.04-.02-.1-.04-.18-.04L13.32 11.46z"/>
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-300">GET IT ON</span>
          <span className="text-sm font-semibold">Google Play</span>
        </div>
      </a>

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
