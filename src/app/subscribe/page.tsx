'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';
import SaderotLogo from '@/components/SaderotLogo';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'new' | 'renewal' | 'both';
  free_months: number;
  paid_months: number;
  monthly_cost: number;
}

interface TeacherSubStatus {
  status: 'active' | 'expired' | 'none';
  active_end_date: string | null;
  last_end_date: string | null;
  teacher: { id: string; name: string; email: string; phone: string };
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function SubscribeForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);

  const [isExistingTeacher, setIsExistingTeacher] = useState<boolean | null>(null);
  const checkedEmail = useRef('');

  const [subStatus, setSubStatus] = useState<TeacherSubStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [confirmExtend, setConfirmExtend] = useState<boolean | null>(null);
  const [startsAfter, setStartsAfter] = useState<string | null>(null);

  const prefilled = useRef(false);

  async function loadPlans(type: 'new' | 'renewal') {
    setPlansLoading(true);
    setSelectedPlanId(null);
    const res = await fetch(`/api/plans?type=${type}`);
    const data: Plan[] = res.ok ? await res.json() : [];
    setPlans(data);
    if (data.length === 1) setSelectedPlanId(data[0].id);
    setPlansLoading(false);
  }

  useEffect(() => {
    const pName = searchParams.get('name') ?? '';
    const pEmail = searchParams.get('email') ?? '';
    const pPhone = searchParams.get('phone') ?? '';
    const pType = searchParams.get('type');

    if (pEmail) {
      setName(pName);
      setEmail(pEmail);
      setPhone(pPhone);
      prefilled.current = true;
      if (pType === 'renewal') {
        setIsExistingTeacher(true);
        loadPlans('renewal');
      }
    }

    fetch('/api/teacher/me/subscription')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: TeacherSubStatus | null) => {
        setSubStatus(data);
        setStatusLoaded(true);

        if (!data) return;

        if (data.status === 'expired' && !prefilled.current) {
          setName(data.teacher.name);
          setEmail(data.teacher.email);
          setPhone(data.teacher.phone);
          prefilled.current = true;
          setIsExistingTeacher(true);
          loadPlans('renewal');
        }
      })
      .catch(() => setStatusLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleEmailBlur() {
    if (prefilled.current) return;
    const normalized = email.toLowerCase().trim();
    if (!normalized || normalized === checkedEmail.current) return;
    checkedEmail.current = normalized;

    setIsExistingTeacher(null);
    setPlans([]);
    setSelectedPlanId(null);

    const res = await fetch(`/api/check-teacher?email=${encodeURIComponent(normalized)}`);
    const { exists } = await res.json();
    setIsExistingTeacher(exists);
    await loadPlans(exists ? 'renewal' : 'new');
  }

  function handleConfirmExtend(yes: boolean) {
    setConfirmExtend(yes);
    if (yes && subStatus?.active_end_date) {
      const after = addDays(subStatus.active_end_date, 1);
      setStartsAfter(after);
      setName(subStatus.teacher.name);
      setEmail(subStatus.teacher.email);
      setPhone(subStatus.teacher.phone);
      prefilled.current = true;
      setIsExistingTeacher(true);
      loadPlans('renewal');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!policiesAccepted) {
      setError(t('subscribe.policyError'));
      return;
    }
    if (plans.length > 0 && !selectedPlanId) {
      setError(t('subscribe.planRequired'));
      return;
    }
    setSubmitting(true);
    setError('');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        comments,
        plan_id: selectedPlanId,
        policies_accepted_at: new Date().toISOString(),
        starts_after: startsAfter,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? t('common.noResults'));
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('subscribe.received')}</h1>
            <p className="text-sm text-gray-500 mt-2">{t('subscribe.receivedDesc')}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-left">
            <p className="font-medium text-blue-800 mb-1">What happens next?</p>
            <p className="text-blue-600">We&apos;ll review your request and get back to you within 24 hours.</p>
          </div>
          <Link href="/" className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">{t('common.backHome')}</Link>
        </div>
      </div>
    );
  }

  // Active subscription — show extend prompt
  if (statusLoaded && subStatus?.status === 'active' && confirmExtend === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-5">
          <div className="flex items-center justify-between mb-2">
            <Link href="/teacher" className="text-xs text-gray-400 hover:text-gray-600">← Dashboard</Link>
            <LanguageToggle />
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Subscription Active</h1>
            <p className="text-sm text-gray-600">
              Your subscription is active
              {subStatus.active_end_date
                ? <> until <span className="font-medium text-gray-900">{formatDate(subStatus.active_end_date)}</span></>
                : ' with no expiry date'
              }.
            </p>
            {subStatus.active_end_date && (
              <p className="text-sm text-gray-500">
                Would you like to extend your subscription beyond that date?
              </p>
            )}
          </div>
          {subStatus.active_end_date ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmExtend(true)}
                className="flex-1 bg-blue-600 text-white text-sm font-medium rounded-xl py-2.5 hover:bg-blue-700 transition-colors"
              >
                Yes, extend
              </button>
              <button
                onClick={() => handleConfirmExtend(false)}
                className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition-colors"
              >
                No, thanks
              </button>
            </div>
          ) : (
            <Link href="/teacher" className="block w-full text-center border border-gray-300 text-gray-600 text-sm font-medium rounded-xl py-2.5 hover:bg-gray-50 transition-colors">
              Back to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Declined extend
  if (statusLoaded && subStatus?.status === 'active' && confirmExtend === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center space-y-4">
          <p className="text-sm text-gray-500">No problem! Come back when you&apos;re ready to renew.</p>
          <Link href="/teacher" className="block text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <SaderotLogo size="md" />
            <LanguageToggle />
          </div>
          <p className="text-xs text-blue-600 font-medium mb-3">The scheduling tool built for private teachers</p>
          <h1 className="text-xl font-semibold text-gray-900">{t('subscribe.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subscribe.subtitle')}</p>
          {startsAfter && (
            <p className="text-sm text-blue-600 mt-2 font-medium">
              New plan will start on {formatDate(startsAfter)}
            </p>
          )}
        </div>

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
              placeholder="Jane Smith"
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
              readOnly={prefilled.current}
              onChange={(e) => {
                if (prefilled.current) return;
                setEmail(e.target.value);
                if (e.target.value.toLowerCase().trim() !== checkedEmail.current) {
                  setIsExistingTeacher(null);
                  setPlans([]);
                  setSelectedPlanId(null);
                }
              }}
              onBlur={handleEmailBlur}
              placeholder="jane@example.com"
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${prefilled.current ? 'bg-gray-50 text-gray-500' : ''}`}
            />
            {!prefilled.current && isExistingTeacher === null && email.includes('@') && (
              <p className="text-xs text-gray-400 mt-1">Tab out of this field to load the right plan for your account.</p>
            )}
            {!prefilled.current && isExistingTeacher === true && (
              <p className="text-xs text-blue-600 mt-1">Welcome back! Showing renewal plans.</p>
            )}
            {!prefilled.current && isExistingTeacher === false && (
              <p className="text-xs text-green-600 mt-1">New account detected. Showing new teacher plans.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.phone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0501234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('subscribe.comments')}</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('subscribe.commentsPlaceholder')}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Plan selection */}
          {isExistingTeacher !== null && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('subscribe.choosePlan')} <span className="text-red-500">*</span>
              </label>
              {plansLoading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                      <div className="flex justify-between">
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 bg-gray-200 rounded" />
                          <div className="h-3 w-20 bg-gray-100 rounded" />
                        </div>
                        <div className="space-y-1.5 text-right">
                          <div className="h-5 w-16 bg-gray-200 rounded" />
                          <div className="h-3 w-12 bg-gray-100 rounded ml-auto" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="text-xs text-gray-400">No plans available.</p>
              ) : plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`block border rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedPlanId === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.id}
                    checked={selectedPlanId === plan.id}
                    onChange={() => setSelectedPlanId(plan.id)}
                    className="sr-only"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-gray-900">
                        ₪{plan.monthly_cost}
                        <span className="text-xs font-normal text-gray-400">/{t('subscribe.monthShort')}</span>
                      </p>
                      <p className="text-xs text-gray-400">× {plan.paid_months} {t('subscribe.monthsLabel')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {plan.free_months > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        +{plan.free_months} {t('subscribe.monthsFree')}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {t('subscribe.total')}: ₪{(plan.monthly_cost * plan.paid_months).toFixed(0)}
                    </span>
                    {selectedPlanId === plan.id && (
                      <span className="ml-auto">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Policy acceptance */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={policiesAccepted}
                onChange={(e) => {
                  setPoliciesAccepted(e.target.checked);
                  if (e.target.checked) setError('');
                }}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 leading-snug">
                {t('subscribe.policyAccept').split(/\{(terms|privacy|refund)\}/).map((p, i) => {
                  if (p === 'terms') return <Link key={i} href="/terms-of-service" target="_blank" className="text-blue-600 hover:underline font-medium">{t('common.termsOfService')}</Link>;
                  if (p === 'privacy') return <Link key={i} href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">{t('common.privacyPolicy')}</Link>;
                  if (p === 'refund') return <Link key={i} href="/refund-policy" target="_blank" className="text-blue-600 hover:underline font-medium">{t('common.refundPolicy')}</Link>;
                  return p;
                })}
                {' '}<span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !policiesAccepted}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? t('common.sending') : t('subscribe.submitRequest')}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already a teacher?{' '}
            <Link href="/teacher/login" className="text-blue-600 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeForm />
    </Suspense>
  );
}
