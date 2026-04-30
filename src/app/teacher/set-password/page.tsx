'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase-browser';
import SaderotLogo from '@/components/SaderotLogo';

type PageState = 'loading' | 'ready' | 'done' | 'invalid';

export default function SetPasswordPage() {
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
      if (event === 'PASSWORD_RECOVERY') setPageState('ready');
    });

    // Fallback: already exchanged the token (PKCE flow)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPageState('ready');
    });

    // If no recovery event after 6s the link is invalid/expired
    const timeout = setTimeout(() => {
      setPageState((s) => s === 'loading' ? 'invalid' : s);
    }, 6000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    const supabase = createBrowserSupabase();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) { setError(updateError.message); return; }

    setPageState('done');
    await supabase.auth.signOut();
    setTimeout(() => router.replace('/teacher/login'), 2500);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <SaderotLogo size="md" showTagline />
        </div>

        {/* Loading */}
        {pageState === 'loading' && (
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Verifying your link…</p>
          </div>
        )}

        {/* Invalid / expired link */}
        {pageState === 'invalid' && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">Link expired or invalid</h2>
            <p className="text-sm text-gray-500">This set-password link has expired. Please contact your administrator to resend the welcome email.</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Password set!</h2>
            <p className="text-sm text-gray-500">Redirecting you to the login page…</p>
          </div>
        )}

        {/* Set password form */}
        {pageState === 'ready' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Set your password</h2>
              <p className="text-sm text-gray-500 mt-1">Choose a password to access your Saderot account.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
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
                {loading ? 'Saving…' : 'Set password & continue'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
