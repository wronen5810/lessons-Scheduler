'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function SubscribePage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comments, setComments] = useState('');
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!policiesAccepted) {
      setError(t('subscribe.policyError'));
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
        policies_accepted_at: new Date().toISOString(),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center space-y-3">
          <div className="text-4xl">✓</div>
          <h1 className="text-lg font-semibold text-gray-900">{t('subscribe.received')}</h1>
          <p className="text-sm text-gray-500">{t('subscribe.receivedDesc')}</p>
          <Link href="/" className="block text-sm text-blue-600 hover:underline mt-2">{t('common.backHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full space-y-5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">{t('common.backHome')}</Link>
            <LanguageToggle />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('subscribe.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subscribe.subtitle')}</p>
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
        </form>
      </div>
    </div>
  );
}
