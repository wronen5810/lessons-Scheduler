'use client';

import { useState } from 'react';
import SaderotLogo from '@/components/SaderotLogo';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from '@/components/LanguageToggle';

export default function StartPage() {
  const { t, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), source: 'start' }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Something went wrong. Please try again.');
      return;
    }
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <SaderotLogo size="md" />
        <LanguageToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {done ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
              <h2 className="text-xl font-bold text-gray-900">{t('start.checkEmail')}</h2>
              <p className="text-sm text-gray-500">{t('start.checkEmailDesc')}</p>
              <p className="text-xs text-gray-400">{email}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">{t('subscribe.title')}</h1>
                <p className="text-sm text-gray-500">{t('subscribe.tagline')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('start.emailPlaceholder')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? t('common.loading') : t('start.cta')}
                </button>
              </form>

              <p className="text-xs text-center text-gray-400">{t('subscribe.noCommitment')}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
