'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { markSessionActive } from '@/components/SessionGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function TeacherLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t('auth.invalidCredentials'));
      setLoading(false);
      return;
    }

    markSessionActive();
    router.push('/teacher');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        {/* Teacher illustration */}
        <div className="flex justify-center mb-6">
          <svg width="160" height="140" viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="15" width="90" height="110" rx="6" fill="#1e40af"/>
            <rect x="35" y="15" width="80" height="110" rx="4" fill="#eff6ff"/>
            <circle cx="30" cy="35" r="4" fill="#1e40af"/>
            <circle cx="30" cy="55" r="4" fill="#1e40af"/>
            <circle cx="30" cy="75" r="4" fill="#1e40af"/>
            <circle cx="30" cy="95" r="4" fill="#1e40af"/>
            <line x1="45" y1="38" x2="105" y2="38" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round"/>
            <line x1="45" y1="50" x2="95" y2="50" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round"/>
            <line x1="45" y1="62" x2="100" y2="62" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round"/>
            <line x1="45" y1="74" x2="88" y2="74" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round"/>
            <text x="52" y="104" fontSize="22" fill="#3b82f6" opacity="0.8">♩♪</text>
            <rect x="108" y="20" width="10" height="70" rx="3" fill="#f59e0b" transform="rotate(25 113 55)"/>
            <polygon points="108,88 118,88 113,100" fill="#374151" transform="rotate(25 113 55)"/>
            <rect x="108" y="18" width="10" height="8" rx="2" fill="#d97706" transform="rotate(25 113 55)"/>
          </svg>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t('auth.teacherLogin')}</h1>
          <LanguageToggle />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <Link href="/teacher/forgot-password" className="text-xs text-blue-600 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
}
