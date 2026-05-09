'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';
import { createBrowserSupabase } from '@/lib/supabase-browser';

function SignupForm() {
  const { t, lang, isRTL } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefillEmail = searchParams.get('email') ?? '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);

  async function handleGoogleSignup() {
    setError('');
    setGoogleLoading(true);
    const supabase = createBrowserSupabase();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=/teacher` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser redirects — no need to setGoogleLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailTaken(false);
    setSubmitting(true);

    const supabase = createBrowserSupabase();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });

    if (signUpError) {
      setSubmitting(false);
      if (
        signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already been registered') ||
        signUpError.message.toLowerCase().includes('email address is already')
      ) {
        setEmailTaken(true);
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // signUp succeeded — if identities array is empty the email was already taken
    // (Supabase returns 200 but no session in this case)
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setSubmitting(false);
      setEmailTaken(true);
      return;
    }

    // Create profile + subscription
    await fetch('/api/self-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    }).catch(() => {});

    router.push('/teacher');
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <SaderotLogo size="md" lang={lang} />
            <LanguageToggle />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('signup.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('signup.subtitle')}</p>
        </div>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || submitting}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {googleLoading ? (
            <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          {t('signup.googleCta')}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{t('signup.orDivider')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('students.fullName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('signup.namePlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('common.email')} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }}
              placeholder="you@example.com"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                prefillEmail && email === prefillEmail
                  ? 'border-green-400 bg-green-50 focus:ring-green-400'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {prefillEmail && email === prefillEmail && !emailTaken && (
              <p className="text-xs text-green-600 mt-1">✓ מוּלא מהדף הקודם — תוכל/י לשנות</p>
            )}
            {emailTaken && (
              <p className="text-sm text-amber-600 mt-1">
                {t('signup.emailTaken')}{' '}
                <Link href="/teacher/login" className="text-blue-600 hover:underline font-medium">
                  {t('signup.signIn')}
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('signup.passwordLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || googleLoading || !name.trim() || !email.trim() || !password}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? t('common.loading') : t('signup.cta')}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('signup.alreadyHave')}{' '}
            <Link href="/teacher/login" className="text-blue-600 hover:underline font-medium">
              {t('signup.signIn')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
