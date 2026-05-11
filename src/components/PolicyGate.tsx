'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SaderotLogo from '@/components/SaderotLogo';
import LanguageToggle from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

type Step = 'policies' | 'features';
type FeatureKey = 'billing' | 'messages' | 'groups' | 'notebook' | 'allow_cancellation';

export default function PolicyGate() {
  const router = useRouter();
  const { t, lang, isRTL } = useLanguage();
  const [step, setStep] = useState<Step>('policies');
  const [agreed, setAgreed] = useState({ privacy: false, terms: false, refund: false });
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    billing: false, messages: false, groups: false, notebook: false, allow_cancellation: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allAgreed = agreed.privacy && agreed.terms && agreed.refund;

  // Inline bilingual helper — avoids adding many one-off i18n keys
  const s = (he: string, en: string) => lang === 'he' ? he : en;

  const featureList = [
    {
      key: 'billing' as const,
      label: s('חיוב', 'Billing'),
      desc:  s('מעקב תשלומים ועלויות שיעורים', 'Track payments and lesson costs'),
    },
    {
      key: 'messages' as const,
      label: s('הודעות', 'Messages'),
      desc:  s('שלח/י הודעות לתלמידים שלך', 'Send messages to your students'),
    },
    {
      key: 'groups' as const,
      label: s('קבוצות', 'Groups'),
      desc:  s('ניהול שיעורים קבוצתיים', 'Manage group lessons'),
    },
    {
      key: 'notebook' as const,
      label: s('מחברת', 'Notebook'),
      desc:  s('הערות תלמידים ומשאבים משותפים', 'Student notes and shared resources'),
    },
    {
      key: 'allow_cancellation' as const,
      label: s('בקשות ביטול מתלמידים', 'Student cancellation requests'),
      desc:  s('אפשר/י לתלמידים לבקש ביטול שיעורים', 'Allow students to request lesson cancellations'),
    },
  ];

  async function handleAcceptPolicies() {
    if (!allAgreed) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/teacher/accept-policies', { method: 'POST' });
    setLoading(false);
    if (!res.ok) {
      setError(s('משהו השתבש. אנא נסה/י שוב.', 'Something went wrong. Please try again.'));
      return;
    }
    setStep('features');
  }

  async function handleSaveFeatures() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/teacher/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(s('משהו השתבש. אנא נסה/י שוב.', 'Something went wrong. Please try again.'));
      return;
    }
    router.push('/teacher/schedule');
    router.refresh();
  }

  return (
    <div
      className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gray-950 px-6 py-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <SaderotLogo size="md" showTagline darkBg />
            <LanguageToggle />
          </div>
          <p className="text-sm text-blue-100 mt-1">
            {step === 'policies'
              ? s('ברוך הבא! לפני שמתחילים, אנא קרא/י את המדיניות שלנו.', 'Welcome! Before you start, please review our policies.')
              : s('שלב 2 מתוך 2 — הגדר/י את התכונות שלך', 'Step 2 of 2 — Set up your features')}
          </p>
          {/* Step dots */}
          <div className="flex gap-1.5 mt-3">
            <span className={`h-1 rounded-full transition-all ${step === 'policies' ? 'bg-white w-6' : 'bg-white/40 w-3'}`} />
            <span className={`h-1 rounded-full transition-all ${step === 'features' ? 'bg-white w-6' : 'bg-white/40 w-3'}`} />
          </div>
        </div>

        <div className="px-6 py-6 space-y-5">

          {/* ── STEP 1: Policies ── */}
          {step === 'policies' && (
            <>
              <div>
                <h2 className="text-base font-bold text-gray-900 mb-1">
                  {s('אישור המדיניות', 'Accept our policies')}
                </h2>
                <p className="text-sm text-gray-500">
                  {s(
                    'אנא קרא/י ואשר/י את שלושת המדיניות כדי להמשיך.',
                    'Please read and agree to all three policies to continue.',
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'privacy' as const, label: t('common.privacyPolicy'), href: '/privacy' },
                  { key: 'terms'   as const, label: t('common.termsOfService'), href: '/terms-of-service' },
                  { key: 'refund'  as const, label: t('common.refundPolicy'),   href: '/refund-policy' },
                ].map(({ key, label, href }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={agreed[key]}
                      onChange={(e) => setAgreed(a => ({ ...a, [key]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700">
                      {s('קראתי ואני מסכים/ה ל', 'I have read and agree to the')}{' '}
                      <Link href={href} target="_blank" className="text-blue-600 hover:underline font-medium">
                        {label}
                      </Link>
                    </span>
                  </label>
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleAcceptPolicies}
                disabled={!allAgreed || loading}
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading
                  ? s('שומר...', 'Saving…')
                  : s('אשר/י והמשך/י ←', 'Accept & Continue →')}
              </button>
            </>
          )}

          {/* ── STEP 2: Features ── */}
          {step === 'features' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  {s('התכונות כבויות כברירת מחדל', 'Features are off by default')}
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {s(
                    'כל התכונות המתקדמות מושבתות כדי לפשט את השימוש. הפעל/י רק את מה שצריך — אפשר תמיד לשנות זאת בהגדרות.',
                    'All advanced features are disabled to keep things simple. Enable only what you need — you can always change this later in Settings.',
                  )}
                </p>
              </div>

              <div className="space-y-2">
                {featureList.map(({ key, label, desc }) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      features[key] ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={features[key]}
                      onChange={(e) => setFeatures(f => ({ ...f, [key]: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleSaveFeatures}
                disabled={loading}
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
              >
                {loading
                  ? s('שומר...', 'Saving…')
                  : s('התחל/י להשתמש בסדר אותי ←', 'Start using saderOT →')}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
