'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';

function TeacherIllustration() {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body */}
      <rect x="70" y="110" width="60" height="75" rx="8" fill="#3B82F6" />
      {/* Collar / shirt detail */}
      <polygon points="100,110 85,130 100,125 115,130" fill="#1D4ED8" />
      {/* Head */}
      <circle cx="100" cy="82" r="28" fill="#FBBF24" />
      {/* Hair */}
      <ellipse cx="100" cy="58" rx="28" ry="12" fill="#92400E" />
      {/* Eyes */}
      <circle cx="91" cy="80" r="3.5" fill="#1E3A5F" />
      <circle cx="109" cy="80" r="3.5" fill="#1E3A5F" />
      {/* Smile */}
      <path d="M91 90 Q100 98 109 90" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <rect x="40" y="112" width="32" height="14" rx="7" fill="#3B82F6" transform="rotate(-20 40 112)" />
      <rect x="128" y="112" width="32" height="14" rx="7" fill="#3B82F6" transform="rotate(20 160 112)" />
      {/* Legs */}
      <rect x="76" y="182" width="20" height="30" rx="6" fill="#1E40AF" />
      <rect x="104" y="182" width="20" height="30" rx="6" fill="#1E40AF" />
      {/* Shoes */}
      <ellipse cx="86" cy="213" rx="14" ry="7" fill="#1E293B" />
      <ellipse cx="114" cy="213" rx="14" ry="7" fill="#1E293B" />
      {/* Whiteboard */}
      <rect x="18" y="55" width="52" height="38" rx="4" fill="white" stroke="#CBD5E1" strokeWidth="2" />
      <line x1="25" y1="68" x2="62" y2="68" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="76" x2="55" y2="76" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="84" x2="58" y2="84" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pointer */}
      <line x1="62" y1="115" x2="68" y2="84" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function StudentIllustration() {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body */}
      <rect x="70" y="110" width="60" height="75" rx="8" fill="#10B981" />
      {/* Collar */}
      <polygon points="100,110 85,130 100,125 115,130" fill="#059669" />
      {/* Head */}
      <circle cx="100" cy="82" r="28" fill="#FDE68A" />
      {/* Hair */}
      <ellipse cx="100" cy="57" rx="28" ry="13" fill="#7C3AED" />
      {/* Eyes */}
      <circle cx="91" cy="80" r="3.5" fill="#1E3A5F" />
      <circle cx="109" cy="80" r="3.5" fill="#1E3A5F" />
      {/* Smile */}
      <path d="M91 90 Q100 98 109 90" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Arms */}
      <rect x="40" y="112" width="32" height="14" rx="7" fill="#10B981" transform="rotate(-15 40 112)" />
      <rect x="128" y="112" width="32" height="14" rx="7" fill="#10B981" transform="rotate(15 160 112)" />
      {/* Legs */}
      <rect x="76" y="182" width="20" height="30" rx="6" fill="#065F46" />
      <rect x="104" y="182" width="20" height="30" rx="6" fill="#065F46" />
      {/* Shoes */}
      <ellipse cx="86" cy="213" rx="14" ry="7" fill="#1E293B" />
      <ellipse cx="114" cy="213" rx="14" ry="7" fill="#1E293B" />
      {/* Book */}
      <rect x="130" y="95" width="36" height="46" rx="3" fill="#F59E0B" />
      <rect x="130" y="95" width="6" height="46" rx="2" fill="#D97706" />
      <line x1="140" y1="108" x2="160" y2="108" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="116" x2="160" y2="116" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="124" x2="155" y2="124" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Graduation cap */}
      <rect x="78" y="53" width="44" height="8" rx="2" fill="#7C3AED" />
      <polygon points="100,42 120,53 80,53" fill="#6D28D9" />
      <line x1="120" y1="53" x2="124" y2="66" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="124" cy="68" r="4" fill="#F59E0B" />
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();

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

      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Lessons Scheduler</h1>
        <p className="text-base sm:text-lg text-gray-500">How are you joining today?</p>
      </div>

      {/* Cards — always 2 columns, responsive sizing */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-2xl">

        {/* Student card */}
        <Link
          href="/student"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-transparent hover:border-blue-300 px-3 py-5 sm:p-8 flex flex-col items-center text-center transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-24 sm:w-40 sm:h-44 mb-3 sm:mb-6 transition-transform duration-200 group-hover:scale-105">
            <StudentIllustration />
          </div>
          <h2 className="text-sm sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">I&apos;m a Student</h2>
          <p className="hidden sm:block text-sm text-gray-500 mb-6">View available slots and book a lesson with your teacher.</p>
          <span className="inline-block bg-blue-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl group-hover:bg-blue-700 transition-colors">
            Book a lesson →
          </span>
        </Link>

        {/* Teacher card */}
        <Link
          href="/teacher/login"
          className="group bg-white rounded-2xl shadow-md hover:shadow-xl border border-transparent hover:border-indigo-300 px-3 py-5 sm:p-8 flex flex-col items-center text-center transition-all duration-200 cursor-pointer"
        >
          <div className="w-20 h-24 sm:w-40 sm:h-44 mb-3 sm:mb-6 transition-transform duration-200 group-hover:scale-105">
            <TeacherIllustration />
          </div>
          <h2 className="text-sm sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">I&apos;m a Teacher</h2>
          <p className="hidden sm:block text-sm text-gray-500 mb-6">Manage your schedule, students, and lesson bookings.</p>
          <span className="inline-block bg-indigo-600 text-white text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl group-hover:bg-indigo-700 transition-colors">
            Go to dashboard →
          </span>
        </Link>

      </div>

      {/* Teacher subscription link */}
      <p className="mt-6 text-sm text-gray-500">
        New teacher?{' '}
        <Link href="/subscribe" className="text-indigo-600 hover:underline font-medium">
          Request a subscription →
        </Link>
      </p>

      {/* Policy links */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <Link href="/privacy" className="hover:text-gray-600 hover:underline">Privacy Policy</Link>
        <span aria-hidden>·</span>
        <Link href="/terms-of-service" className="hover:text-gray-600 hover:underline">Terms of Service</Link>
        <span aria-hidden>·</span>
        <Link href="/refund-policy" className="hover:text-gray-600 hover:underline">Refund Policy</Link>
      </div>

    </div>
  );
}
