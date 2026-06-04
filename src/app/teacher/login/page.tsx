'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import { markSessionActive } from '@/components/SessionGuard';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';

type Step = 'credentials' | 'totp';

export default function TeacherLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(t('auth.invalidCredentials'));
      setLoading(false);
      return;
    }

    // Check if 2FA is required for this account
    const res = await fetch('/api/teacher/2fa/status');
    const data = res.ok ? await res.json() : null;

    if (data?.totp_enabled) {
      setLoading(false);
      setStep('totp');
    } else {
      fetch('/api/teacher/record-login', { method: 'POST' }).catch(() => {});
      markSessionActive(true);
      router.push('/teacher');
      router.refresh();
    }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/teacher/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: totpCode }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Invalid code');
      setLoading(false);
      return;
    }

    fetch('/api/teacher/record-login', { method: 'POST' }).catch(() => {});
    markSessionActive(true);
    router.push('/teacher');
    router.refresh();
  }

  async function cancelTotp() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    setStep('credentials');
    setTotpCode('');
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <SaderotLogo size="md" showTagline />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">{t('common.back')}</Link>
            <LanguageToggle />
          </div>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className="space-y-4">
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

            <div className="text-center pt-1">
              <Link href="/subscribe" className="text-sm text-blue-600 hover:underline font-medium">
                {t('auth.newSubscribe')}
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">Two-factor authentication</h2>
              <p className="text-xs text-gray-500 mt-1">Open Google Authenticator and enter the 6-digit code for Saderot.</p>
            </div>

            <div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || totpCode.length < 6}
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={cancelTotp}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
