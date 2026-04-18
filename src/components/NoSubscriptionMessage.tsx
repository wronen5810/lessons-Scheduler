'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NoSubscriptionMessage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await createBrowserSupabase().auth.signOut();
    router.replace('/teacher/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{t('teacher.noSubscription')}</h1>
        <p className="text-sm text-gray-500">{t('teacher.noSubscriptionDesc')}</p>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {signingOut ? '...' : t('common.signOut')}
        </button>
      </div>
    </div>
  );
}
