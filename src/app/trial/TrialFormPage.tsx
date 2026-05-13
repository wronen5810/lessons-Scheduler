'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import SaderotLogo from '@/components/SaderotLogo';

const ORANGE = '#b5472f';

const BULLETS = [
  { icon: '📅', text: 'תזמון שיעורים בקליק — הסטודנטים מבקשים בעצמם' },
  { icon: '🔔', text: 'תזכורות אוטומטיות בוואטסאפ ואימייל' },
  { icon: '💳', text: '3 חודשים חינם, ביטול בכל עת, ללא כרטיס אשראי' },
];

export default function TrialFormPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTaken, setEmailTaken] = useState(false);

  async function handleGoogleSignup() {
    setError('');
    setGoogleLoading(true);
    const supabase = createBrowserSupabase();
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=/teacher` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success the browser redirects — no cleanup needed
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailTaken(false);
    setSubmitting(true);

    const registerRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
    });

    if (!registerRes.ok) {
      const body = await registerRes.json().catch(() => ({}));
      setSubmitting(false);
      if (body.error === 'email_taken') {
        setEmailTaken(true);
      } else {
        setError(body.error ?? 'אירעה שגיאה. נסה/י שוב.');
      }
      return;
    }

    const supabase = createBrowserSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.push('/teacher');
  }

  return (
    <div className="min-h-screen bg-[#f7f5f3]" dir="rtl">
      {/* Orange promo strip */}
      <div className="w-full text-center py-2 px-4" style={{ backgroundColor: ORANGE }}>
        <p className="text-white font-semibold text-sm">🎁 3 חודשים חינם — ללא כרטיס אשראי · ביטול בכל עת</p>
      </div>

      <div className="max-w-[420px] mx-auto px-4 py-4">
        {/* Logo + Headline */}
        <div className="flex items-center justify-between mb-3">
          <SaderotLogo size="md" lang="he" />
          <h1 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>
            ניהול שיעורים — פשוט וחכם
          </h1>
        </div>

        {/* Value bullets */}
        <div className="space-y-1.5 mb-4">
          {BULLETS.map((item) => (
            <div
              key={item.icon}
              className="flex items-center gap-2.5 bg-white rounded-lg px-3 py-2 shadow-sm"
              style={{ border: '1px solid #e8e8e8' }}
            >
              <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
              <span className="text-xs" style={{ color: '#1a1a1a' }}>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Signup card */}
        <div
          className="bg-white rounded-2xl shadow-sm p-4 space-y-3"
          style={{ border: '1px solid #e8e8e8' }}
        >
          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || submitting}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
            )}
            המשך/י עם Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#e8e8e8]" />
            <span className="text-xs text-gray-400">או</span>
            <div className="flex-1 h-px bg-[#e8e8e8]" />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: '#1a1a1a' }}>שם מלא</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="השם המלא שלך"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b5472f] text-right"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: '#1a1a1a' }}>אימייל</label>
              <input
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailTaken(false); }}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b5472f] text-left"
              />
              {emailTaken && (
                <p className="text-sm text-amber-600 mt-1">
                  האימייל הזה כבר רשום.{' '}
                  <Link href="/teacher/login" className="underline font-medium">
                    כניסה
                  </Link>
                </p>
              )}
            </div>

            {/* Password with show/hide */}
            <div>
              <label className="block text-xs font-medium mb-0.5" style={{ color: '#1a1a1a' }}>סיסמה</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#b5472f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 left-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={submitting || googleLoading || !name.trim() || !email.trim() || !password}
              className="w-full text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: ORANGE }}
            >
              {submitting ? 'רגע...' : 'התחל/י 3 חודשים חינם'}
            </button>

            <p className="text-center text-xs text-gray-500">
              🔒 ללא כרטיס אשראי · ביטול בכל עת
            </p>
          </form>
        </div>

        {/* Sign-in link */}
        <p className="text-center text-sm text-gray-500 mt-3">
          כבר יש לך חשבון?{' '}
          <Link href="/teacher/login" className="font-medium underline" style={{ color: ORANGE }}>
            התחברות
          </Link>
        </p>
      </div>
    </div>
  );
}
