'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

type PageState = 'loading' | 'ready' | 'done' | 'invalid';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createBrowserSupabase();

    // Supabase fires PASSWORD_RECOVERY after processing the link hash/code
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
      }
    });

    // Fallback: if already in a valid session via hash exchange (implicit flow)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPageState('ready');
    });

    // Timeout — if no recovery event after 5s, the link is invalid/expired
    const timeout = setTimeout(() => {
      setPageState((s) => (s === 'loading' ? 'invalid' : s));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError(t('auth.passwordMismatch')); return; }
    if (password.length < 8) { setError(t('auth.passwordTooShort')); return; }

    setLoading(true);
    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }

    setPageState('done');
    setTimeout(() => router.replace('/teacher/login'), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{t('auth.forgotPasswordTitle')}</h1>
          <LanguageToggle />
        </div>

        {pageState === 'loading' && (
          <p className="text-sm text-gray-400 text-center py-6">{t('common.loading')}</p>
        )}

        {pageState === 'invalid' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">{t('auth.invalidResetLink')}</p>
            <Link href="/teacher/forgot-password" className="block text-sm text-blue-600 hover:underline">
              {t('auth.sendResetLink')}
            </Link>
          </div>
        )}

        {pageState === 'done' && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">{t('auth.passwordUpdated')}</h2>
            <p className="text-sm text-gray-500">{t('auth.passwordUpdatedDesc')}</p>
          </div>
        )}

        {pageState === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.newPassword')}</label>
              <input
                type="password"
                required
                autoFocus
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('auth.resettingPassword') : t('auth.resetPassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
