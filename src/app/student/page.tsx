'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import SaderotLogo from '@/components/SaderotLogo';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

interface Teacher {
  id: string;
  display_name: string;
}

type Step = 'email' | 'otp' | 'privacy' | 'teachers';

export default function StudentEntryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>('email');
  const [identifier, setIdentifier] = useState('');
  const [resolvedEmail, setResolvedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  function storeTokens(tokens: Record<string, string>) {
    for (const [tid, tok] of Object.entries(tokens)) {
      localStorage.setItem(`st_${tid}`, tok);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/student-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
      return;
    }

    if (data.tokens) storeTokens(data.tokens);

    const studentEmail: string = data.student_email || identifier.toLowerCase().trim();
    setResolvedEmail(studentEmail);

    // 2FA required — show OTP entry screen
    if (data.requires_2fa) {
      setStep('otp');
      return;
    }

    if (!data.privacy_accepted) {
      setPendingTeachers(data.teachers);
      setStep('privacy');
      return;
    }

    if (data.teachers.length === 1) {
      router.push(`/t/${data.teachers[0].id}?email=${encodeURIComponent(studentEmail)}`);
    } else {
      setTeachers(data.teachers);
      setStep('teachers');
    }
  }

  async function handlePrivacyAccept() {
    setLoading(true);
    const res = await fetch('/api/student/accept-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resolvedEmail, teacherIds: pendingTeachers.map(t => t.id) }),
    });
    const data = res.ok ? await res.json() : {};
    if (data.tokens) storeTokens(data.tokens);
    setLoading(false);

    if (pendingTeachers.length === 1) {
      router.push(`/t/${pendingTeachers[0].id}?email=${encodeURIComponent(resolvedEmail)}`);
    } else {
      setTeachers(pendingTeachers);
      setStep('teachers');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError('');
    setLoading(true);
    const res = await fetch('/api/student/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: resolvedEmail, code: otpCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setOtpError(data.error || t('join.invalidCode'));
      return;
    }
    if (data.tokens) storeTokens(data.tokens);

    if (!data.privacy_accepted) {
      setPendingTeachers(data.teachers);
      setStep('privacy');
      return;
    }

    if (data.teachers?.length === 1) {
      router.push(`/t/${data.teachers[0].id}?email=${encodeURIComponent(resolvedEmail)}`);
    } else if (data.teachers?.length > 1) {
      setTeachers(data.teachers);
      setStep('teachers');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Brand header */}
        <div className="flex items-center justify-between mb-6">
          <SaderotLogo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">{t('common.back')}</Link>
            <LanguageToggle />
          </div>
        </div>

        {/* Student icon — only on the entry step */}
        {step === 'email' && (
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-purple-600" strokeWidth={1.5} />
            </div>
          </div>
        )}

        <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('join.title')}</h1>

        {step === 'email' && (
          <>
            <p className="text-sm text-gray-500 mb-6">{t('join.enterEmailGeneric')}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.emailOrPhone')}</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('join.emailPlaceholder')}
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? t('join.lookingUp') : t('common.continue')}
              </button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('join.twoFactorTitle')}</h2>
            <p className="text-sm text-gray-500 mb-5">{t('join.twoFactorDesc')}</p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('join.verificationCode')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('join.codePlaceholder')}
                  autoFocus
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {otpError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{otpError}</p>
              )}
              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? t('join.verifying') : t('join.verifyCode')}
              </button>
            </form>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtpCode(''); setOtpError(''); }}
              className="w-full mt-3 text-xs text-gray-400 hover:text-gray-600"
            >
              {t('join.differentEmail')}
            </button>
          </>
        )}

        {step === 'privacy' && (
          <>
            <p className="text-sm text-gray-500 mb-4">{t('join.privacyIntro')}</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm text-gray-600">
              <p>{t('student.privacyBody')}</p>
              <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline mt-2 inline-block">
                {t('join.readFullPolicy')}
              </Link>
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={privacyChecked}
                onChange={(e) => setPrivacyChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t('join.agreePrivacy')}
              </span>
            </label>
            <button
              onClick={handlePrivacyAccept}
              disabled={!privacyChecked || loading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {t('common.continue')}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setPrivacyChecked(false); }}
              className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600"
            >
              {t('join.differentEmail')}
            </button>
          </>
        )}

        {step === 'teachers' && (
          <>
            <p className="text-sm text-gray-500 mb-4">{t('student.multipleTeachers')}</p>
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => router.push(`/t/${teacher.id}?email=${encodeURIComponent(resolvedEmail)}`)}
                  className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:border-blue-400 transition-colors"
                >
                  {teacher.display_name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setStep('email'); setIdentifier(''); }}
              className="mt-4 text-xs text-gray-400 hover:text-gray-600"
            >
              {t('common.back')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
