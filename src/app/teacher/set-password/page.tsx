'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SaderotLogo from '@/components/SaderotLogo';

type PageState = 'loading' | 'ready' | 'done' | 'invalid';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [pageState, setPageState] = useState<PageState>(token ? 'loading' : 'invalid');
  const [needsName, setNeedsName] = useState(false);
  const [needsPhone, setNeedsPhone] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setPageState('invalid'); return; }
    fetch(`/api/teacher/set-initial-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (!data.valid) { setPageState('invalid'); return; }
        setNeedsName(data.needsName);
        setNeedsPhone(data.needsPhone);
        setPageState('ready');
      })
      .catch(() => setPageState('invalid'));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (needsName && !name.trim()) { setError('Please enter your full name.'); return; }
    if (needsPhone && !phone.trim()) { setError('Please enter your phone number.'); return; }

    setLoading(true);
    const res = await fetch('/api/teacher/set-initial-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, name: needsName ? name : undefined, phone: needsPhone ? phone : undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }

    setPageState('done');
    setTimeout(() => router.replace('/teacher/login'), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">

        <div className="flex justify-center mb-6">
          <SaderotLogo size="md" showTagline />
        </div>

        {/* Loading */}
        {pageState === 'loading' && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Invalid / missing token */}
        {pageState === 'invalid' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Link expired or invalid</h2>
            <p className="text-sm text-gray-500">This link has expired or already been used. Please contact your administrator to resend the welcome email.</p>
          </div>
        )}

        {/* Success */}
        {pageState === 'done' && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">All set!</h2>
            <p className="text-sm text-gray-500">Redirecting you to the login page…</p>
          </div>
        )}

        {/* Set password form */}
        {pageState === 'ready' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Welcome to Saderot</h2>
              <p className="text-sm text-gray-500 mt-1">
                {needsName || needsPhone
                  ? 'Complete your profile and set a password to get started.'
                  : 'Choose a password to access your account.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {needsName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {needsPhone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0501234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  autoFocus={!needsName && !needsPhone}
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Same password again"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving…' : needsName || needsPhone ? 'Save & continue' : 'Set password & continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}
